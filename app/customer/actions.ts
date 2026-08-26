"use server";

import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { contentSubmissionSchema } from "@/lib/business/validation";
import { extractReceiptData } from "@/lib/business/ocr";
import { validateReceiptOcr, hasSeriesAgustinItem } from "@/lib/business/receiptValidation";
import { writeAuditLog } from "@/lib/business/auditLog";
import { revalidatePath } from "next/cache";

export type ActionState = { error?: string; success?: string } | undefined;

const PG_UNIQUE_VIOLATION = "23505";
const DUPLICATE_RECEIPT_MESSAGE = "Struk ini sudah pernah digunakan untuk klaim sebelumnya.";
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export type ClaimReceiptItem = { name: string; qty: number; price: number };

export type ClaimReceiptState =
  | { status: "valid"; claimId: string; branchName: string; items: ClaimReceiptItem[]; total: number }
  | { status: "invalid"; reason: string }
  | { status: "error"; error: string };

/** Lowercases and strips everything but letters/digits, so punctuation/spacing
 * differences between how a POS prints a branch name and how it's stored in
 * `branches` (e.g. "CABANG DAGO" vs "Aurora Hijab Dago, Bandung") don't
 * prevent a match. */
function normalizeForMatch(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/** "Aurora Hijab Dago, Bandung" -> "Dago" — the distinctive area name a
 * receipt is far more likely to print than the full formal branch name. */
function branchAreaFromName(name: string): string {
  const withoutBrand = name.replace(/^aurora hijab\s*/i, "");
  return withoutBrand.split(",")[0]?.trim() ?? withoutBrand;
}

/**
 * Resolves the branch a receipt was purchased at from whatever merchant text
 * Gemini read off it. Tried in order of specificity: the branch's own short
 * `code` (e.g. "DAGO"), its area name (e.g. "Dago"), then its full formal
 * name — each compared with punctuation/spacing normalized out, since a
 * receipt header rarely matches the DB's full "Aurora Hijab X, City" string
 * verbatim.
 */
function resolveBranchFromMerchant<T extends { id: string; name: string; code: string }>(
  merchantName: string | null,
  branches: T[]
): T | null {
  if (!merchantName) return null;
  const merchant = normalizeForMatch(merchantName);
  if (!merchant) return null;

  for (const b of branches) {
    const code = normalizeForMatch(b.code);
    if (code && merchant.includes(code)) return b;
  }
  for (const b of branches) {
    const area = normalizeForMatch(branchAreaFromName(b.name));
    if (area && merchant.includes(area)) return b;
  }
  for (const b of branches) {
    const full = normalizeForMatch(b.name);
    if (full && (merchant.includes(full) || full.includes(merchant))) return b;
  }
  return null;
}

/**
 * The entire "Claim" flow in one call: OCR the uploaded struk, validate it
 * deterministically, resolve which branch it belongs to, and — only if
 * everything checks out — create the bill + claim rows. There is no
 * separate "confirm"/submit step and no branch/amount/item form fields
 * anymore: every piece of data that ends up in the database is either the
 * customer's own session (`user.id`) or something Gemini read off the photo
 * and this function re-verified in plain code. Nothing is trusted from the
 * client beyond the raw image bytes.
 *
 * Called directly from the client (not via useActionState/<form action>),
 * so it never redirects — the caller decides when to navigate to
 * `/customer/claims/{claimId}` once it gets a "valid" result back. Nothing
 * is persisted for an "invalid" or "error" result, so a user retrying with
 * a different photo can never end up with duplicate/orphaned claim rows.
 */
export async function submitClaimReceipt(formData: FormData): Promise<ClaimReceiptState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", error: "Sesi berakhir, silakan login ulang." };
  const supabase = createAdminClient();
  const actor = { id: user.id, username: user.username, role: user.role };

  const photo = formData.get("photo") as File | null;
  if (!photo || photo.size === 0) return { status: "error", error: "Foto struk wajib diunggah." };
  if (photo.size > 5 * 1024 * 1024) return { status: "error", error: "Ukuran foto maksimal 5MB." };
  // Restricted to the image formats Gemini Vision reliably accepts, rather
  // than a blanket "image/*" — an unsupported format (gif, svg, ...) would
  // otherwise reach the OCR call and fail unpredictably.
  if (!SUPPORTED_IMAGE_TYPES.has(photo.type)) {
    return { status: "error", error: "Format file harus JPG, PNG, atau WEBP." };
  }

  const photoBuffer = Buffer.from(await photo.arrayBuffer());
  const photoHash = createHash("sha256").update(photoBuffer).digest("hex");

  await writeAuditLog({
    action: "receipt_uploaded",
    status: "success",
    actor,
    entityType: "bill",
    branchId: user.branchId,
    metadata: { photoHash, sizeBytes: photo.size, mimeType: photo.type },
  });

  // Hard anti-duplicate check #1: the exact same photo bytes can never back
  // a second claim. Checked before spending an OCR call.
  const { data: existingByHash } = await supabase.from("bills").select("id").eq("photo_hash", photoHash).maybeSingle();
  if (existingByHash) {
    await writeAuditLog({
      action: "claim_invalid",
      status: "failed",
      actor,
      entityType: "bill",
      branchId: user.branchId,
      metadata: { reason: "duplicate_photo_hash", photoHash },
    });
    return { status: "invalid", reason: DUPLICATE_RECEIPT_MESSAGE };
  }

  const [{ data: branches }, { data: periodSetting }, { data: minAmountSetting }, { data: profile }] = await Promise.all([
    supabase.from("branches").select("id, name, code").eq("active", true),
    supabase.from("campaign_settings").select("value").eq("key", "redemption_period").maybeSingle(),
    supabase.from("campaign_settings").select("value").eq("key", "min_claim_amount").maybeSingle(),
    supabase.from("profiles").select("branch_id").eq("id", user.id).single(),
  ]);

  const ocrOutcome = await extractReceiptData(photoBuffer, photo.type);
  if (!ocrOutcome.ok) {
    await writeAuditLog({
      action: "ocr_failed",
      status: "failed",
      actor,
      entityType: "bill",
      branchId: user.branchId,
      metadata: { photoHash, error: ocrOutcome.error },
    });
    return { status: "error", error: ocrOutcome.error };
  }
  const ocr = ocrOutcome.data;
  await writeAuditLog({
    action: "ocr_success",
    status: "success",
    actor,
    entityType: "bill",
    branchId: user.branchId,
    metadata: { photoHash, merchantName: ocr.merchant_name, quality: ocr.quality, total: ocr.total },
  });

  // Branch is resolved from what the OCR read off the receipt — never from
  // a form field, since there isn't one anymore. If the merchant text on
  // the struk doesn't clearly match a known branch, fall back to the
  // customer's own registered branch (set at signup, e.g. via a branch QR
  // code) — still not manual input at claim time. Only if neither resolves
  // do we have no legal branch_id to store (bills/claims require one).
  const branchList = branches ?? [];
  const resolvedBranch =
    resolveBranchFromMerchant(ocr.merchant_name, branchList) ?? branchList.find((b) => b.id === profile?.branch_id) ?? null;
  if (!resolvedBranch) {
    await writeAuditLog({
      action: "claim_invalid",
      status: "failed",
      actor,
      entityType: "bill",
      metadata: { reason: "branch_not_resolved", merchantName: ocr.merchant_name },
    });
    return {
      status: "invalid",
      reason: "Cabang pembelian tidak dapat dikenali dari struk. Pastikan nama cabang terlihat jelas pada foto, lalu upload ulang.",
    };
  }

  const period = periodSetting?.value as { start: string; end: string } | undefined;
  const redemptionPeriodEnd = period?.end ? new Date(period.end) : null;
  const minClaimAmount = typeof minAmountSetting?.value === "number" ? minAmountSetting.value : 0;

  const validation = validateReceiptOcr(ocr, {
    redemptionPeriodEnd,
    minClaimAmount,
    branchName: resolvedBranch.name,
  });
  if (!validation.ok) {
    await writeAuditLog({
      action: "claim_invalid",
      status: "failed",
      actor,
      entityType: "bill",
      branchId: resolvedBranch.id,
      branchName: resolvedBranch.name,
      metadata: { reason: validation.error },
    });
    return { status: "invalid", reason: validation.error ?? "Struk tidak valid, silakan upload ulang." };
  }

  // The campaign's core eligibility rule — from OCR items only, never
  // anything the customer could type.
  if (!hasSeriesAgustinItem(ocr.items)) {
    await writeAuditLog({
      action: "claim_invalid",
      status: "failed",
      actor,
      entityType: "bill",
      branchId: resolvedBranch.id,
      branchName: resolvedBranch.name,
      metadata: { reason: "series_agustin_not_found" },
    });
    return {
      status: "invalid",
      reason: 'Struk tidak menunjukkan pembelian "Series Agustin". Pastikan item ini tercantum jelas pada struk, lalu upload ulang.',
    };
  }

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
      .eq("branch_id", resolvedBranch.id)
      .eq("receipt_number", ocr.receipt_number)
      .maybeSingle();
    if (existingByReceiptNumber) {
      await writeAuditLog({
        action: "claim_invalid",
        status: "failed",
        actor,
        entityType: "bill",
        branchId: resolvedBranch.id,
        branchName: resolvedBranch.name,
        metadata: { reason: "duplicate_receipt_number", receiptNumber: ocr.receipt_number },
      });
      return { status: "invalid", reason: DUPLICATE_RECEIPT_MESSAGE };
    }
  }

  const items: ClaimReceiptItem[] = (ocr.items ?? []).map((it) => ({
    name: it.name ?? "-",
    qty: it.qty ?? 1,
    price: it.price ?? 0,
  }));

  const ext = photo.name.split(".").pop() || "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("receipts").upload(path, photoBuffer, {
    contentType: photo.type,
    upsert: false,
  });
  if (uploadError) {
    await writeAuditLog({
      action: "claim_created",
      status: "failed",
      actor,
      entityType: "bill",
      branchId: resolvedBranch.id,
      branchName: resolvedBranch.name,
      metadata: { reason: "storage_upload_failed", error: uploadError.message },
    });
    return { status: "error", error: "Gagal mengunggah foto struk: " + uploadError.message };
  }

  const { data: bill, error: billError } = await supabase
    .from("bills")
    .insert({
      customer_id: user.id,
      branch_id: resolvedBranch.id,
      amount: verifiedAmount,
      items,
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
    if (billError.code === PG_UNIQUE_VIOLATION) {
      await writeAuditLog({
        action: "claim_invalid",
        status: "failed",
        actor,
        entityType: "bill",
        branchId: resolvedBranch.id,
        branchName: resolvedBranch.name,
        metadata: { reason: "duplicate_receipt_unique_constraint" },
      });
      return { status: "invalid", reason: DUPLICATE_RECEIPT_MESSAGE };
    }
    await writeAuditLog({
      action: "claim_created",
      status: "failed",
      actor,
      entityType: "bill",
      branchId: resolvedBranch.id,
      branchName: resolvedBranch.name,
      metadata: { reason: billError.message },
    });
    return { status: "error", error: "Gagal menyimpan struk: " + billError.message };
  }
  if (!bill) return { status: "error", error: "Gagal menyimpan struk." };

  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .insert({
      customer_id: user.id,
      branch_id: resolvedBranch.id,
      bill_id: bill.id,
      purchase_status: "HOLD",
      flagged: validation.flagReasons.length > 0,
      flag_reason: validation.flagReasons.length > 0 ? validation.flagReasons.join("; ") : null,
    })
    .select("id")
    .single();
  if (claimError || !claim) {
    await writeAuditLog({
      action: "claim_created",
      status: "failed",
      actor,
      entityType: "bill",
      entityId: bill.id,
      branchId: resolvedBranch.id,
      branchName: resolvedBranch.name,
      metadata: { reason: claimError?.message ?? "unknown error" },
    });
    return { status: "error", error: "Gagal membuat klaim: " + (claimError?.message ?? "") };
  }

  await writeAuditLog({
    action: "claim_valid",
    status: "success",
    actor,
    entityType: "claim",
    entityId: claim.id,
    branchId: resolvedBranch.id,
    branchName: resolvedBranch.name,
    metadata: { billId: bill.id, total: verifiedAmount, flagged: validation.flagReasons.length > 0 },
  });
  await writeAuditLog({
    action: "claim_created",
    status: "success",
    actor,
    entityType: "claim",
    entityId: claim.id,
    branchId: resolvedBranch.id,
    branchName: resolvedBranch.name,
  });

  revalidatePath("/customer/dashboard");
  return { status: "valid", claimId: claim.id, branchName: resolvedBranch.name, items, total: verifiedAmount };
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
    await writeAuditLog({
      action: "unauthorized_access",
      status: "failed",
      actor: { id: user.id, username: user.username, role: user.role },
      entityType: "claim",
      entityId: String(parsed.data.claimId),
      metadata: { attemptedAction: "content_submitted" },
    });
    return { error: "Klaim tidak ditemukan" };
  }

  // Anti-duplicate-submission guard: block a new submission for this tier
  // while a previous one is still PENDING/HOLD (server-side — the UI hides
  // the form in this state, but the action itself must not trust that,
  // since it can be invoked directly). Only a REJECTED (or no) prior
  // submission for this tier may be retried, per the "retry without
  // repurchasing" rule.
  const { data: existingForTier } = await supabase
    .from("content_submissions")
    .select("status")
    .eq("claim_id", parsed.data.claimId)
    .eq("type", parsed.data.type)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingForTier && existingForTier.status !== "REJECTED") {
    return {
      error:
        existingForTier.status === "APPROVED"
          ? "Konten untuk tier ini sudah disetujui."
          : "Konten untuk tier ini masih dalam review. Tunggu hasil review sebelum submit ulang.",
    };
  }

  const { error } = await supabase.from("content_submissions").insert({
    claim_id: parsed.data.claimId,
    type: parsed.data.type,
    platform: parsed.data.platform,
    url: parsed.data.url,
    status: "PENDING",
  });

  await writeAuditLog({
    action: "content_submitted",
    status: error ? "failed" : "success",
    actor: { id: user.id, username: user.username, role: user.role },
    entityType: "content_submission",
    entityId: parsed.data.claimId,
    metadata: { type: parsed.data.type, platform: parsed.data.platform, error: error?.message },
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
