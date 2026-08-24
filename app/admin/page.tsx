import { createAdminClient } from "@/lib/supabase/admin";
import { formatIDR } from "@/lib/utils";

export default async function AdminOverview() {
  const supabase = createAdminClient();

  const [{ count: claimCount }, { count: holdBills }, { count: pendingContent }, { data: vouchers }] =
    await Promise.all([
      supabase.from("claims").select("*", { count: "exact", head: true }),
      supabase.from("bills").select("*", { count: "exact", head: true }).eq("status", "HOLD"),
      supabase.from("content_submissions").select("*", { count: "exact", head: true }).eq("status", "PENDING"),
      supabase.from("vouchers").select("status, value, redeemed_amount"),
    ]);

  const active = vouchers?.filter((v) => v.status === "ACTIVE").length ?? 0;
  const redeemed = vouchers?.filter((v) => v.status === "REDEEMED") ?? [];
  const totalRedeemedValue = redeemed.reduce((sum, v) => sum + Number(v.redeemed_amount ?? v.value ?? 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-plum-600 dark:text-cream-100">Overview Campaign</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="stat-box">
          <p className="text-xs font-semibold text-plum-400 dark:text-cream-100/60">Total Klaim</p>
          <p className="font-display text-2xl font-bold text-plum-600 dark:text-cream-100">{claimCount ?? 0}</p>
        </div>
        <div className="stat-box">
          <p className="text-xs font-semibold text-plum-400 dark:text-cream-100/60">Struk Perlu Verifikasi</p>
          <p className="font-display text-2xl font-bold text-plum-600 dark:text-cream-100">{holdBills ?? 0}</p>
        </div>
        <div className="stat-box">
          <p className="text-xs font-semibold text-plum-400 dark:text-cream-100/60">Konten Pending</p>
          <p className="font-display text-2xl font-bold text-plum-600 dark:text-cream-100">{pendingContent ?? 0}</p>
        </div>
        <div className="stat-box">
          <p className="text-xs font-semibold text-plum-400 dark:text-cream-100/60">Voucher Aktif</p>
          <p className="font-display text-2xl font-bold text-plum-600 dark:text-cream-100">{active}</p>
        </div>
      </div>

      <div className="card">
        <p className="text-xs font-semibold text-plum-400 dark:text-cream-100/60">Total Nilai Voucher Ditukarkan</p>
        <p className="font-display text-3xl font-bold text-plum-600 dark:text-cream-100">{formatIDR(totalRedeemedValue)}</p>
        <p className="mt-1 text-xs text-plum-400 dark:text-cream-100/60">{redeemed.length} voucher telah ditukarkan</p>
      </div>
    </div>
  );
}
