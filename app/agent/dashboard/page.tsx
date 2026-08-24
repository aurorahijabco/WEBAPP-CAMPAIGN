import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { formatIDR, formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function AgentDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("branch_id").eq("id", user!.id).single();

  const { data: vouchers } = await supabase
    .from("vouchers")
    .select("*, profiles!vouchers_customer_id_fkey(name)")
    .eq("branch_id", profile?.branch_id)
    .order("created_at", { ascending: false });

  const active = vouchers?.filter((v) => v.status === "ACTIVE") ?? [];
  const redeemed = vouchers?.filter((v) => v.status === "REDEEMED") ?? [];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-plum-600 dark:text-cream-100">Dashboard Cabang</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="stat-box">
          <p className="font-display text-2xl font-bold text-plum-600 dark:text-cream-100">{active.length}</p>
          <p className="mt-0.5 text-[11px] font-semibold text-plum-400 dark:text-cream-100/60">Voucher Aktif</p>
        </div>
        <div className="stat-box">
          <p className="font-display text-2xl font-bold text-plum-600 dark:text-cream-100">{redeemed.length}</p>
          <p className="mt-0.5 text-[11px] font-semibold text-plum-400 dark:text-cream-100/60">Sudah Ditukar</p>
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
        <p className="section-title mb-3">Voucher Aktif di Cabang Ini</p>
        {active.length ? (
          <div className="card divide-y divide-cream-200 p-2 dark:divide-plum-500/30">
            {active.map((v: any) => (
              <div key={v.id} className="flex items-center justify-between gap-3 px-2.5 py-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-[13px] font-bold text-plum-600 dark:text-cream-100">{v.code}</p>
                  <p className="text-[11.5px] text-plum-400 dark:text-cream-100/60">
                    {v.profiles?.name} · {formatDate(v.created_at)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-plum-600 dark:text-cream-100">{formatIDR(v.value)}</p>
                  <Badge status={v.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty card">Belum ada voucher aktif.</div>
        )}
      </div>
    </div>
  );
}
