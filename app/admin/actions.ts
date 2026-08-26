"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { billReviewSchema, contentReviewSchema } from "@/lib/business/validation";
import { writeAuditLog } from "@/lib/business/auditLog";
import { revalidatePath } from "next/cache";

export type ActionState = { error?: string; success?: string } | undefined;

async function assertAdmin() {
  const user = await getCurrentUser();
  const supabase = createAdminClient();
  return { supabase, user, ok: user?.role === "admin" };
}

async function logUnauthorized(user: Awaited<ReturnType<typeof getCurrentUser>>, attemptedAction: string) {
  await writeAuditLog({
    action: "unauthorized_access",
    status: "failed",
    actor: user ? { id: user.id, username: user.username, role: user.role } : null,
    entityType: "route",
    metadata: { attemptedAction },
  });
}

export async function reviewBill(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user, ok } = await assertAdmin();
  if (!ok) {
    await logUnauthorized(user, "reviewBill");
    return { error: "Tidak diizinkan" };
  }

  const parsed = billReviewSchema.safeParse({
    billId: formData.get("billId"),
    status: formData.get("status"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { error } = await supabase
    .from("bills")
    .update({
      status: parsed.data.status,
      note: parsed.data.note ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.billId);

  await writeAuditLog({
    action: "bill_reviewed",
    status: error ? "failed" : "success",
    actor: { id: user!.id, username: user!.username, role: user!.role },
    entityType: "bill",
    entityId: String(parsed.data.billId),
    metadata: { newStatus: parsed.data.status, note: parsed.data.note ?? null, error: error?.message },
  });

  if (error) return { error: "Gagal memperbarui struk: " + error.message };

  revalidatePath("/admin/receipts");
  revalidatePath("/admin/claims");
  return { success: "Status struk diperbarui." };
}

export async function reviewContent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user, ok } = await assertAdmin();
  if (!ok || !user) {
    await logUnauthorized(user, "reviewContent");
    return { error: "Tidak diizinkan" };
  }

  const parsed = contentReviewSchema.safeParse({
    submissionId: formData.get("submissionId"),
    status: formData.get("status"),
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  if ((parsed.data.status === "REJECTED" || parsed.data.status === "HOLD") && !parsed.data.reason) {
    return { error: "Alasan wajib diisi untuk status REJECTED / HOLD" };
  }

  const { error } = await supabase
    .from("content_submissions")
    .update({
      status: parsed.data.status,
      reason: parsed.data.reason ?? null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", parsed.data.submissionId);

  await writeAuditLog({
    action: "content_reviewed",
    status: error ? "failed" : "success",
    actor: { id: user.id, username: user.username, role: user.role },
    entityType: "content_submission",
    entityId: String(parsed.data.submissionId),
    metadata: { newStatus: parsed.data.status, reason: parsed.data.reason ?? null, error: error?.message },
  });

  if (error) return { error: "Gagal memperbarui konten: " + error.message };

  revalidatePath("/admin/content");
  return { success: "Status konten diperbarui." };
}

export async function toggleBranchActive(branchId: string, active: boolean) {
  const { supabase, user, ok } = await assertAdmin();
  if (!ok) {
    await logUnauthorized(user, "toggleBranchActive");
    return { error: "Tidak diizinkan" };
  }

  const { error } = await supabase.from("branches").update({ active }).eq("id", branchId);

  await writeAuditLog({
    action: "branch_status_changed",
    status: error ? "failed" : "success",
    actor: { id: user!.id, username: user!.username, role: user!.role },
    entityType: "branch",
    entityId: branchId,
    metadata: { active, error: error?.message },
  });

  revalidatePath("/admin/branches");
}
