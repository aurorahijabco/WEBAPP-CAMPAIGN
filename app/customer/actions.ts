"use server";

import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { contentSubmissionSchema, claimReceiptSchema } from "@/lib/business/validation";
import { writeAuditLog } from "@/lib/business/auditLog";
import { revalidatePath } from "next/cache";

export type ActionState = { error?: string; success?: string } | undefined;

const PG_UNIQUE_VIOLATION = "23505";
const DUPLICATE_RECEIPT_MESSAGE = "Struk ini sudah pernah digunakan untuk klaim sebelumnya.";
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export type ClaimReceiptState =
  | { status: "valid"; claimId: string; branchName: string; total: number }
  | { status: "invalid"; reason: string }
  | { status: "error"; error: string };

/**
 * The "Claim" flow, without any automated OCR verification: uploads the
 * struk photo and creates the bill + claim rows with `HOLD` status
 * ("menunggu review"), so a Super Admin can manually inspect the photo and
 * approve (VALID) or reject (INVALID) it — see app/admin/receipts. Nothing
 * is trusted from the client beyond the raw image bytes and the
 * customer-declared total (which the admin verifies visually against the
 * photo during manual review; it is never used to auto-approve anything).
 * The purchase branch is always the customer's own registered branch
 * (set at signup) — never inferred or entered manually here.
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
  if (!SUPPORTED_IMAGE_TYPES.has(photo.type)) {
    return { status: "error", error: "Format file harus JPG, PNG, atau WEBP." };
  }

  const parsedAmount = claimReceiptSchema.safeParse({ amount: formData.get("amount") });
  if (!parsedAmount.success) {
    return { status: "error", error: parsedAmount.error.issues[0]?.message ?? "Nominal total belanja tidak valid" };
  }
  const declaredAmount = parsedAmount.data.amount;

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

  // Hard anti-duplicate check: the exact same photo bytes can never back a
  // second claim. The DB's unique index on photo_hash is the authoritative
  // guard against a race with the insert below; this pre-check only exists
  // to return a friendly message instead of a raw constraint-violation error
  // in the common case.
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

  const { data: branch } = await supabase.from("branches").select("id, name").eq("id", user.branchId).maybeSingle();
  if (!branch) {
    await writeAuditLog({
      action: "claim_invalid",
      status: "failed",
      actor,
      entityType: "bill",
      metadata: { reason: "branch_not_resolved" },
    });
    return {
      status: "invalid",
      reason: "Cabang akun kamu belum terdaftar dengan benar. Hubungi CS Aurora Hijab sebelum mengunggah struk.",
    };
  }

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
      branchId: branch.id,
      branchName: branch.name,
      metadata: { reason: "storage_upload_failed", error: uploadError.message },
    });
    return { status: "error", error: "Gagal mengunggah foto struk: " + uploadError.message };
  }

  // Everything OCR used to auto-extract (item list, receipt number,
  // merchant name) is intentionally left unset — a Super Admin now verifies
  // the purchase and its details directly from the uploaded photo.
  const { data: bill, error: billError } = await supabase
    .from("bills")
    .insert({
      customer_id: user.id,
      branch_id: branch.id,
      amount: declaredAmount,
      items: [],
      photo_path: path,
      photo_hash: photoHash,
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
        branchId: branch.id,
        branchName: branch.name,
        metadata: { reason: "duplicate_receipt_unique_constraint" },
      });
      return { status: "invalid", reason: DUPLICATE_RECEIPT_MESSAGE };
    }
    await writeAuditLog({
      action: "claim_created",
      status: "failed",
      actor,
      entityType: "bill",
      branchId: branch.id,
      branchName: branch.name,
      metadata: { reason: billError.message },
    });
    return { status: "error", error: "Gagal menyimpan struk: " + billError.message };
  }
  if (!bill) return { status: "error", error: "Gagal menyimpan struk." };

  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .insert({
      customer_id: user.id,
      branch_id: branch.id,
      bill_id: bill.id,
      purchase_status: "HOLD",
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
      branchId: branch.id,
      branchName: branch.name,
      metadata: { reason: claimError?.message ?? "unknown error" },
    });
    return { status: "error", error: "Gagal membuat klaim: " + (claimError?.message ?? "") };
  }

  await writeAuditLog({
    action: "claim_created",
    status: "success",
    actor,
    entityType: "claim",
    entityId: claim.id,
    branchId: branch.id,
    branchName: branch.name,
    metadata: { billId: bill.id, declaredAmount },
  });

  revalidatePath("/customer/dashboard");
  return { status: "valid", claimId: claim.id, branchName: branch.name, total: declaredAmount };
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
    .select("id, customer_id, purchase_status")
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

  // Content can only be submitted after a Super Admin has manually approved
  // the struk/claim (purchase_status = VALID) — never while it's still
  // HOLD (pending review) or after it's been rejected (INVALID). The UI
  // hides the form outside this state, but the action itself must not
  // trust that, since it can be invoked directly.
  if (claim.purchase_status !== "VALID") {
    return { error: "Klaim ini belum disetujui. Tunggu hasil review struk sebelum mengirim konten." };
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
