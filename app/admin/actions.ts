"use server";

import { createClient } from "@/lib/supabase/server";
import { billReviewSchema, contentReviewSchema } from "@/lib/business/validation";
import { revalidatePath } from "next/cache";

export type ActionState = { error?: string; success?: string } | undefined;

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, ok: false as const };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return { supabase, ok: profile?.role === "admin" };
}

export async function reviewBill(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, ok } = await assertAdmin();
  if (!ok) return { error: "Tidak diizinkan" };

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

  if (error) return { error: "Gagal memperbarui struk: " + error.message };

  revalidatePath("/admin/receipts");
  revalidatePath("/admin/claims");
  return { success: "Status struk diperbarui." };
}

export async function reviewContent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, ok } = await assertAdmin();
  if (!ok) return { error: "Tidak diizinkan" };

  const parsed = contentReviewSchema.safeParse({
    submissionId: formData.get("submissionId"),
    status: formData.get("status"),
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  if ((parsed.data.status === "REJECTED" || parsed.data.status === "HOLD") && !parsed.data.reason) {
    return { error: "Alasan wajib diisi untuk status REJECTED / HOLD" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("content_submissions")
    .update({
      status: parsed.data.status,
      reason: parsed.data.reason ?? null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user!.id,
    })
    .eq("id", parsed.data.submissionId);

  if (error) return { error: "Gagal memperbarui konten: " + error.message };

  revalidatePath("/admin/content");
  return { success: "Status konten diperbarui." };
}

export async function toggleBranchActive(branchId: string, active: boolean) {
  const { supabase, ok } = await assertAdmin();
  if (!ok) return { error: "Tidak diizinkan" };

  await supabase.from("branches").update({ active }).eq("id", branchId);
  revalidatePath("/admin/branches");
}
