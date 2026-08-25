"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { createBranchSchema, updateBranchSchema, deleteBranchSchema } from "@/lib/business/validation";
import { revalidatePath } from "next/cache";

export type ActionState = { error?: string; success?: string } | undefined;

async function assertAdmin() {
  const user = await getCurrentUser();
  const supabase = createAdminClient();
  return { supabase, user, ok: user?.role === "admin" };
}

/** Postgres unique_violation / foreign_key_violation codes, for friendly messages
 * instead of leaking raw SQL errors to the UI. */
const PG_UNIQUE_VIOLATION = "23505";
const PG_FOREIGN_KEY_VIOLATION = "23503";

export async function createBranch(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, ok } = await assertAdmin();
  if (!ok) return { error: "Tidak diizinkan" };

  const parsed = createBranchSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    qrCode: formData.get("qrCode"),
    address: formData.get("address") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  const { name, code, qrCode, address } = parsed.data;

  const { error } = await supabase.from("branches").insert({
    name,
    code,
    qr_code: qrCode,
    address: address || null,
  });

  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) {
      return { error: "Kode cabang atau kode QR sudah digunakan cabang lain." };
    }
    return { error: "Gagal menambahkan cabang: " + error.message };
  }

  revalidatePath("/admin/branches");
  return { success: "Cabang baru berhasil ditambahkan." };
}

export async function updateBranch(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, ok } = await assertAdmin();
  if (!ok) return { error: "Tidak diizinkan" };

  const parsed = updateBranchSchema.safeParse({
    branchId: formData.get("branchId"),
    name: formData.get("name"),
    code: formData.get("code"),
    qrCode: formData.get("qrCode"),
    address: formData.get("address") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  const { branchId, name, code, qrCode, address } = parsed.data;

  const { error } = await supabase
    .from("branches")
    .update({ name, code, qr_code: qrCode, address: address || null })
    .eq("id", branchId);

  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) {
      return { error: "Kode cabang atau kode QR sudah digunakan cabang lain." };
    }
    return { error: "Gagal memperbarui cabang: " + error.message };
  }

  revalidatePath("/admin/branches");
  return { success: "Data cabang berhasil diperbarui." };
}

export async function deleteBranch(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, ok } = await assertAdmin();
  if (!ok) return { error: "Tidak diizinkan" };

  const parsed = deleteBranchSchema.safeParse({ branchId: formData.get("branchId") });
  if (!parsed.success) return { error: "Data tidak valid" };
  const { branchId } = parsed.data;

  // Pre-check for dependent rows so we can give a clear, specific reason
  // instead of letting a raw foreign-key violation reach the UI. Bills,
  // claims, and vouchers keep branch_id NOT NULL by design (they're
  // transactional records that must never be silently orphaned or
  // cascade-deleted), so a branch with real history can never be deleted —
  // only deactivated via the existing Aktif/Nonaktif toggle.
  const [{ count: agentCount }, { count: billCount }, { count: claimCount }, { count: voucherCount }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("branch_id", branchId).eq("role", "agent"),
    supabase.from("bills").select("*", { count: "exact", head: true }).eq("branch_id", branchId),
    supabase.from("claims").select("*", { count: "exact", head: true }).eq("branch_id", branchId),
    supabase.from("vouchers").select("*", { count: "exact", head: true }).eq("branch_id", branchId),
  ]);

  const blockers: string[] = [];
  if (agentCount) blockers.push(`${agentCount} agent`);
  if (billCount) blockers.push(`${billCount} struk`);
  if (claimCount) blockers.push(`${claimCount} klaim`);
  if (voucherCount) blockers.push(`${voucherCount} voucher`);

  if (blockers.length) {
    return {
      error: `Cabang tidak bisa dihapus karena masih terhubung ke ${blockers.join(", ")}. Nonaktifkan cabang ini sebagai gantinya.`,
    };
  }

  const { error } = await supabase.from("branches").delete().eq("id", branchId);
  if (error) {
    // Defensive fallback in case a dependent row was created in the gap
    // between the checks above and this delete (race condition).
    if (error.code === PG_FOREIGN_KEY_VIOLATION) {
      return { error: "Cabang tidak bisa dihapus karena masih terhubung ke data lain. Nonaktifkan cabang ini sebagai gantinya." };
    }
    return { error: "Gagal menghapus cabang: " + error.message };
  }

  revalidatePath("/admin/branches");
  return { success: "Cabang berhasil dihapus." };
}
