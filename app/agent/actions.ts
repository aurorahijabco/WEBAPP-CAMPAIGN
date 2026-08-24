"use server";

import { createClient } from "@/lib/supabase/server";
import { redeemSchema } from "@/lib/business/validation";
import { revalidatePath } from "next/cache";

export type ActionState =
  | { error?: string; success?: string; voucher?: { code: string; value: number } }
  | undefined;

/**
 * Looks up a voucher by code for the agent's own branch, for the
 * "review before confirm" step in the redeem UI. Read-only.
 */
export async function lookupVoucher(code: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vouchers")
    .select("*, profiles!vouchers_customer_id_fkey(name, whatsapp)")
    .eq("code", code.trim())
    .maybeSingle();

  if (error || !data) return { error: "Voucher tidak ditemukan" };
  return { voucher: data };
}

/**
 * All actual authorization (branch match, ACTIVE status, redemption period)
 * is enforced server-side inside the `redeem_voucher` Postgres function —
 * this action is a thin, validated wrapper around that RPC call.
 */
export async function redeemVoucher(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = redeemSchema.safeParse({
    code: formData.get("code"),
    productName: formData.get("productName"),
    amount: formData.get("amount"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("redeem_voucher", {
    p_code: parsed.data.code,
    p_product_name: parsed.data.productName,
    p_amount: parsed.data.amount,
  });

  if (error) {
    return { error: mapRedeemError(error.message) };
  }

  revalidatePath("/agent/dashboard");
  return { success: "Voucher berhasil ditukarkan!", voucher: { code: data.code, value: data.value } };
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
