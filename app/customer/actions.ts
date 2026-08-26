"use server";

import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { newClaimSchema, contentSubmissionSchema } from "@/lib/business/validation";
import { extractReceiptData } from "@/lib/business/ocr";
import { validateReceiptOcr } from "@/lib/business/receiptValidation";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type ActionState = { error?: string; success?: string } | undefined;

const PG_UNIQUE_VIOLATION = "23505";
const DUPLICATE_RECEIPT_MESSAGE = "Struk ini sudah pernah digunakan untuk klaim sebelumnya.";

/**
 * Creates a bill (receipt) + claim in one flow. The receipt photo is
 * uploaded to the private `receipts` bucket under `{user_id}/{random}.{ext}`
 * via the service-role client — storage RLS no longer applies (there is no
 * Supabase-issued session to authenticate as the owner), so ownership is
 * enforced here by the `user.id` we just validated via our own session.
 *
 * The photo is also sent to Gemini Vision for OCR (`lib/business/ocr.ts`).
 * The extracted total is what gets stored as the bill's `amount` — the
 * customer-typed `amount` field is never trusted for that; it's only used
 * to flag a large mismatch for admin review. Gemini's own `is_receipt`
 * verdict is likewise never trusted alone — `validateReceiptOcr` re-checks
 * completeness, campaign period, minimum amount, and merchant deterministically
 * in plain code before anything is persisted.
 */
export async function createClaim(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesi berakhir, silakan login ulang." };
  const supabase = createAdminClient();

  const itemNames = formData.getAll("itemName");
  const itemQtys = formData.getAll("itemQty");
  const itemPrices = formData.getAll("itemPrice");
  const items = itemNames.map((name, i) => ({
    name: String(name),
    qty: Number(itemQtys[i] ?? 1),
    price: Number(itemPrices[i] ?? 0),
  }));

  const parsed = newClaimSchema.safeParse({
    branchId: formData.get("branchId"),
    amount: formData.get("amount"),
    items,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data klaim tidak valid" };
  }

  const photo = formData.get("photo") as File | null;
  if (!photo || photo.size === 0) return { error: "Foto struk wajib diunggah" };
  if (photo.size > 5 * 1024 * 1024) return { error: "Ukuran foto maksimal 5MB" };
  // Restricted to the image formats Gemini Vision reliably accepts, rather
  // than a blanket "image/*" — an unsupported format (gif, svg, ...) would
  // otherwise reach the OCR call and fail unpredictably.
  const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
  if (!SUPPORTED_IMAGE_TYPES.has(photo.type)) {
    return { error: "Format file harus JPG, PNG, atau WEBP." };
  }

  const photoBuffer = Buffer.from(await photo.arrayBuffer());
  const photoHash = createHash("sha256").update(photoBuffer).digest("hex");

  // Hard anti-duplicate check #1: the exact same photo bytes can never back
  // a second claim. Checked before spending an OCR call.
  const { data: existingByHash } = await supabase.from("bills").select("id").eq("photo_hash", photoHash).maybeSingle();
  if (existingByHash) return { error: DUPLICATE_RECEIPT_MESSAGE };

  const [{ data: branch }, { data: periodSetting }, { data: minAmountSetting }] = await Promise.all([
    supabase.from("branches").select("name").eq("id", parsed.data.branchId).single(),
    supabase.from("campaign_settings").select("value").eq("key", "redemption_period").maybeSingle(),
    supabase.from("campaign_settings").select("value").eq("key", "min_claim_amount").maybeSingle(),
  ]);
  if (!branch) return { error: "Cabang tidak ditemukan." };

  const period = periodSetting?.value as { start: string; end: string } | undefined;
  const redemptionPeriodEnd = period?.end ? new Date(period.end) : null;
  const minClaimAmount = typeof minAmountSetting?.value === "number" ? minAmountSetting.value : 0;

  const ocrOutcome = await extractReceiptData(photoBuffer, photo.type);
  if (!ocrOutcome.ok) return { error: ocrOutcome.error };

  const validation = validateReceiptOcr(ocrOutcome.data, {
    redemptionPeriodEnd,
    minClaimAmount,
    branchName: branch.name as string,
    clientAmount: parsed.data.amount,
  });
  if (!validation.ok) return { error: validation.error ?? "Struk tidak valid, silakan upload ulang." };

  const ocr = ocrOutcome.data;
  const verifiedAmount = ocr.total as number; // non-null, enforced by validateReceiptOcr

  // Hard anti-duplicate check #2: same physical receipt (by its printed
  // number) claimed twice at the same branch. The DB has a matching unique
  // index as the authoritative guard against a race between this check and
  // the insert below; this pre-check only exists to return a friendly
  // message instead of a raw constraint-violation error in the common case.
  if (ocr.receipt_number) {
    const { data: existingByReceiptNumber } = await supabase
      .from("bills")
      .select("id")
      .eq("branch_id", parsed.data.branchId)
      .eq("receipt_number", ocr.receipt_number)
      .maybeSingle();
    if (existingByReceiptNumber) return { error: DUPLICATE_RECEIPT_MESSAGE };
  }

  const ext = photo.name.split(".").pop() || "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("receipts").upload(path, photoBuffer, {
    contentType: photo.type,
    upsert: false,
  });
  if (uploadError) return { error: "Gagal mengunggah foto struk: " + uploadError.message };

  const { data: bill, error: billError } = await supabase
    .from("bills")
    .insert({
      customer_id: user.id,
      branch_id: parsed.data.branchId,
      amount: verifiedAmount,
      items: parsed.data.items,
      photo_path: path,
      photo_hash: photoHash,
      receipt_number: ocr.receipt_number,
      merchant_name: ocr.merchant_name,
      ocr_raw: ocr,
      status: "HOLD",
    })
    .select("id")
    .single();
  if (billError) {
    if (billError.code === PG_UNIQUE_VIOLATION) return { error: DUPLICATE_RECEIPT_MESSAGE };
    return { error: "Gagal menyimpan struk: " + billError.message };
  }
  if (!bill) return { error: "Gagal menyimpan struk." };

  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .insert({
      customer_id: user.id,
      branch_id: parsed.data.branchId,
      bill_id: bill.id,
      purchase_status: "HOLD",
      flagged: validation.flagReasons.length > 0,
      flag_reason: validation.flagReasons.length > 0 ? validation.flagReasons.join("; ") : null,
    })
    .select("id")
    .single();
  if (claimError || !claim) return { error: "Gagal membuat klaim: " + claimError?.message };

  revalidatePath("/customer/dashboard");
  redirect(`/customer/claims/${claim.id}`);
}

export async function submitContent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesi berakhir, silakan login ulang." };
  const supabase = createAdminClient();

  const parsed = contentSubmissionSchema.safeParse({
    claimId: formData.get("claimId"),
    type: formData.get("type"),
    platform: formData.get("platform"),
    url: formData.get("url"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data konten tidak valid" };
  }

  // Ownership check — the service-role client bypasses RLS, so this
  // application-level check is now the only thing enforcing it.
  const { data: claim } = await supabase
    .from("claims")
    .select("id, customer_id")
    .eq("id", parsed.data.claimId)
    .single();
  if (!claim || claim.customer_id !== user.id) {
    return { error: "Klaim tidak ditemukan" };
  }

  const { error } = await supabase.from("content_submissions").insert({
    claim_id: parsed.data.claimId,
    type: parsed.data.type,
    platform: parsed.data.platform,
    url: parsed.data.url,
    status: "PENDING",
  });
  if (error) return { error: "Gagal mengirim konten: " + error.message };

  revalidatePath(`/customer/claims/${parsed.data.claimId}`);
  return { success: "Konten berhasil dikirim dan menunggu review." };
}

export async function markNotificationsRead(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const supabase = createAdminClient();

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  revalidatePath("/customer/notifications");
}
