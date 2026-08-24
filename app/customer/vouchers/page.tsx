import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { formatIDR, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { CopyCodeButton } from "./CopyCodeButton";

export default async function VouchersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = createAdminClient();

  const { data: vouchers } = await supabase
    .from("vouchers")
    .select("*, branches(name)")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4 pb-4">
      <p className="section-title">Voucher Saya</p>

      {!vouchers?.length && (
        <div className="empty card">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-cream-100 text-gold-500 dark:bg-plum-500/30">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
              <path d="M3 9a2 2 0 0 0 0 4v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a2 2 0 0 1 0-4V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" />
            </svg>
          </div>
          <p className="mt-3.5 font-display text-base font-bold text-plum-600 dark:text-cream-100">Belum ada voucher</p>
          <p className="mx-auto mt-1 max-w-[260px] text-[12.5px]">
            Selesaikan klaim dan konten untuk mendapatkan voucher.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vouchers?.map((v: any) => (
          <div key={v.id} className="ticket">
            <div className="flex items-start justify-between gap-2.5 px-[18px] pb-3.5 pt-[18px]">
              <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-rose-200">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-gold-400">
                  <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
                </svg>
                Aurora Hijab Voucher
              </p>
              <Badge status={v.status} />
            </div>
            <p className="px-[18px] font-mono text-[26px] font-bold leading-none tracking-tight text-gold-400">
              {formatIDR(v.value)}
            </p>
            <p className="px-[18px] pb-3.5 pt-1.5 text-[11px] text-white/70">
              Berlaku untuk Series Sarimbit di {v.branches?.name}
            </p>

            <div className="ticket-perf" />

            <div className="flex flex-wrap items-center justify-between gap-2.5 px-[18px] pb-[18px] pt-3.5">
              <div>
                <p className="flex items-center gap-2 font-mono text-[13px] tracking-wide text-white/90">{v.code}</p>
                {v.status === "REDEEMED" ? (
                  <p className="mt-0.5 text-[10.5px] text-white/60">
                    Ditukarkan {formatDate(v.redeemed_at)} sebesar {formatIDR(v.redeemed_amount ?? v.value)}
                  </p>
                ) : (
                  <p className="mt-0.5 text-[10.5px] text-white/60">dibuat {formatDate(v.created_at)}</p>
                )}
              </div>
              <CopyCodeButton code={v.code} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
