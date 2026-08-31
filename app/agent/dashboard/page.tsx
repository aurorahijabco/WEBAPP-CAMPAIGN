import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { formatIDR, formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function AgentDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/agent-login");
  const supabase = createAdminClient();

  const { data: profile } = await supabase.from("profiles").select("branch_id").eq("id", user.id).single();

  // Only the columns the Agent Dashboard actually renders. Voucher `id`
  // (primary key) and `code` (redeem code) are intentionally NEVER selected
  // here — agents on this page may only ever see name/date/nominal/status.
  // The redeem code is only ever revealed via the separate lookupVoucher
  // action, which requires the agent to already have the code in hand from
  // the customer at redemption time.
  const { data: vouchers } = await supabase
    .from("vouchers")
    .select("status, value, redeemed_amount, redeemed_at, created_at, profiles!vouchers_customer_id_fkey(name)")
    .eq("branch_id", profile?.branch_id)
    .order("created_at", { ascending: false });

  const list = vouchers ?? [];
  const countByStatus = (status: string) => list.filter((v) => v.status === status).length;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-plum-600 dark:text-cream-100">Dashboard Cabang</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="stat-box">
          <p className="font-display text-2xl font-bold text-plum-600 dark:text-cream-100">{countByStatus("RESERVED")}</p>
          <p className="mt-0.5 text-[11px] font-semibold text-plum-400 dark:text-cream-100/60">Reserved</p>
        </div>
        <div className="stat-box">
          <p className="font-display text-2xl font-bold text-plum-600 dark:text-cream-100">{countByStatus("ACTIVE")}</p>
          <p className="mt-0.5 text-[11px] font-semibold text-plum-400 dark:text-cream-100/60">Voucher Aktif</p>
        </div>
        <div className="stat-box">
          <p className="font-display text-2xl font-bold text-plum-600 dark:text-cream-100">{countByStatus("REDEEMED")}</p>
          <p className="mt-0.5 text-[11px] font-semibold text-plum-400 dark:text-cream-100/60">Sudah Ditukar</p>
        </div>
        <div className="stat-box">
          <p className="font-display text-2xl font-bold text-plum-600 dark:text-cream-100">{countByStatus("EXPIRED")}</p>
          <p className="mt-0.5 text-[11px] font-semibold text-plum-400 dark:text-cream-100/60">Kedaluwarsa</p>
        </div>
      </div>

      <Link href="/agent/redeem" className="btn-gold w-full">
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px]">
          <path d="M4 8V5a1 1 0 0 1 1-1h3M20 8V5a1 1 0 0 0-1-1h-3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3" />
          <path d="M4 12h16" />
        </svg>
        Redeem Voucher
      </Link>

      <div>
        <p className="section-title mb-3">Status Voucher di Cabang Ini</p>
        <p className="mb-3 text-xs text-plum-400 dark:text-cream-100/60">
          Daftar ini bersifat read-only. Perubahan status voucher hanya terjadi melalui proses redeem resmi.
        </p>
        {list.length ? (
          <div className="card divide-y divide-cream-200 p-2 dark:divide-plum-500/30">
            {list.map((v: any, i: number) => (
              <div key={i} className="flex items-center justify-between gap-3 px-2.5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-plum-600 dark:text-cream-100">{v.profiles?.name ?? "—"}</p>
                  <p className="text-[11.5px] text-plum-400 dark:text-cream-100/60">
                    {formatDate(v.status === "REDEEMED" && v.redeemed_at ? v.redeemed_at : v.created_at)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-plum-600 dark:text-cream-100">
                    {formatIDR(v.status === "REDEEMED" ? v.redeemed_amount ?? v.value : v.value)}
                  </p>
                  <Badge status={v.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty card">Belum ada voucher di cabang ini.</div>
        )}
      </div>
    </div>
  );
}
