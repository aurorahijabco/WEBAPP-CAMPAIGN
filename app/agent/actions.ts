"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { redeemSchema } from "@/lib/business/validation";
import { revalidatePath } from "next/cache";

export type ActionState =
  | { error?: string; success?: string; voucher?: { code: string; value: number } }
  | undefined;

export type LookupState =
  | { error?: string }
  | { voucher: { code: string; status: string; value: number; customerName: string | null; branchId: string } }
  | undefined;

/**
 * Looks up a voucher by code for the agent's own branch — the "validate
 * before redeem" step. Read-only, returns only what the redeem UI needs to
 * display (never lets the caller set the nominal). Branch scoping here is
 * a UX nicety (an agent shouldn't be told about another branch's voucher);
 * the `redeem_voucher` RPC re-checks branch match authoritatively.
 */
export async function lookupVoucher(_prev: LookupState, formData: FormData): Promise<LookupState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "agent") return { error: "Sesi berakhir, silakan login ulang." };

  const code = String(formData.get("code") ?? "").trim();
  if (code.length < 4) return { error: "Kode voucher tidak valid" };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("vouchers")
    .select("code, status, value, branch_id, profiles!vouchers_customer_id_fkey(name)")
    .eq("code", code)
    .maybeSingle();

  if (error || !data) return { error: "Voucher tidak ditemukan" };
  if (data.branch_id !== user.branchId) {
    return { error: "Voucher ini terdaftar di cabang lain, tidak bisa ditukar di sini." };
  }

  const customer = data.profiles as unknown as { name: string } | null;
  return {
    voucher: {
      code: data.code,
      status: data.status,
      value: data.value,
      customerName: customer?.name ?? null,
      branchId: data.branch_id,
    },
  };
}

/**
 * All actual authorization (branch match, ACTIVE status, redemption period)
 * is enforced server-side inside the `redeem_voucher` Postgres function —
 * this action is a thin, validated wrapper around that RPC call. The
 * calling agent's id comes from our own validated session (there is no
 * `auth.uid()` anymore), passed explicitly to the RPC. The nominal is never
 * accepted from the client: `redeem_voucher` always sets redeemed_amount
 * from the voucher's own `value` column, and the RPC's `for update` row
 * lock means two concurrent redeem attempts for the same code can't both
 * succeed (the second sees status already REDEEMED).
 */
export async function redeemVoucher(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "agent") return { error: "Sesi berakhir, silakan login ulang." };

  const parsed = redeemSchema.safeParse({
    code: formData.get("code"),
    productName: formData.get("productName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("redeem_voucher", {
    p_agent_id: user.id,
    p_code: parsed.data.code,
    p_product_name: parsed.data.productName,
  });

  if (error) {
    return { error: mapRedeemError(error.message) };
  }

  revalidatePath("/agent/dashboard");
  return { success: "Voucher berhasil ditukarkan!", voucher: { code: data.code, value: data.redeemed_amount ?? data.value } };
}

function mapRedeemError(message: string): string {
  if (message.includes("VOUCHER_NOT_FOUND")) return "Kode voucher tidak ditemukan.";
  if (message.includes("BRANCH_MISMATCH")) return "Voucher ini hanya bisa ditukar di cabang tempat klaim diajukan.";
  if (message.includes("OUTSIDE_REDEMPTION_PERIOD")) return "Saat ini di luar periode redemption.";
  if (message.includes("ALREADY_REDEEMED")) return "Voucher ini sudah pernah ditukarkan.";
  if (message.includes("VOUCHER_EXPIRED")) return "Voucher sudah kedaluwarsa.";
  if (message.includes("VOUCHER_NOT_ACTIVE")) return "Voucher belum aktif (masih RESERVED atau status lain).";
  if (message.includes("PRODUCT_REQUIRED")) return "Pilih produk Series Sarimbit terlebih dahulu.";
  if (message.includes("AGENT_NO_BRANCH")) return "Akun agen ini belum terhubung ke cabang manapun.";
  return "Gagal menukarkan voucher: " + message;
}
