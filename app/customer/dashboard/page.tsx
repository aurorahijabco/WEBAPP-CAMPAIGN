import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatIDR } from "@/lib/utils";

export default async function CustomerDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("name").eq("id", user!.id).single();

  const { data: claims } = await supabase
    .from("claims")
    .select("id, purchase_status, flagged, created_at, branches(name)")
    .eq("customer_id", user!.id)
    .order("created_at", { ascending: false });

  const { data: vouchers } = await supabase
    .from("vouchers")
    .select("id, status, value")
    .eq("customer_id", user!.id);

  const activeVouchers = vouchers?.filter((v) => v.status === "ACTIVE").length ?? 0;
  const totalValue = vouchers?.reduce((sum, v) => sum + v.value, 0) ?? 0;
  const name = profile?.name ?? "Customer";

  return (
    <div className="space-y-6 pb-4">
      <div className="flex items-center gap-3">
        <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl border border-cream-200 bg-gradient-to-br from-cream-100 to-cream-200 font-display text-lg font-bold text-plum-600 dark:border-plum-500/40 dark:from-plum-600 dark:to-plum-500 dark:text-cream-100">
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-[11.5px] font-semibold text-plum-400 dark:text-cream-100/60">Halo,</p>
          <p className="font-display text-lg font-bold text-plum-600 dark:text-cream-100">{name}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="stat-box">
          <p className="font-display text-2xl font-bold text-plum-600 dark:text-cream-100">{claims?.length ?? 0}</p>
          <p className="mt-0.5 text-[11px] font-semibold text-plum-400 dark:text-cream-100/60">Total Klaim</p>
        </div>
        <div className="stat-box">
          <p className="font-display text-2xl font-bold text-plum-600 dark:text-cream-100">{vouchers?.length ?? 0}</p>
          <p className="mt-0.5 text-[11px] font-semibold text-plum-400 dark:text-cream-100/60">Total Voucher</p>
        </div>
        <div className="stat-box">
          <p className="font-display text-2xl font-bold text-plum-600 dark:text-cream-100">{activeVouchers}</p>
          <p className="mt-0.5 text-[11px] font-semibold text-plum-400 dark:text-cream-100/60">Voucher Aktif</p>
        </div>
        <div className="stat-box">
          <p className="font-display text-lg font-bold text-plum-600 dark:text-cream-100 sm:text-2xl">
            {formatIDR(totalValue)}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-plum-400 dark:text-cream-100/60">Total Nilai Voucher</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="section-title">Klaim Saya</p>
        <Link href="/customer/claims/new" className="text-xs font-bold text-gold-500 underline underline-offset-2">
          + Klaim Baru
        </Link>
      </div>

      {claims?.length ? (
        <div className="card divide-y divide-cream-200 p-2 dark:divide-plum-500/30">
          {claims.map((c: any) => (
            <Link key={c.id} href={`/customer/claims/${c.id}`} className="list-row">
              <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-cream-100 text-gold-500 dark:bg-plum-500/30">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px]">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6M8 13h8M8 17h8M8 9h2" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-bold text-plum-600 dark:text-cream-100">
                  {c.branches?.name ?? "Cabang"}
                </p>
                <p className="text-[11.5px] text-plum-400 dark:text-cream-100/60">{formatDate(c.created_at)}</p>
                {c.flagged && <p className="mt-0.5 text-[11px] font-semibold text-danger">⚠ Sedang direview admin</p>}
              </div>
              <Badge status={c.purchase_status} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty card">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-cream-100 text-rose-500 dark:bg-plum-500/30">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
              <path d="M22 12h-6l-2 3h-4l-2-3H2" />
              <path d="M5.5 5h13l3 7v7a2 2 0 0 1-2 2H4.5a2 2 0 0 1-2-2v-7z" />
            </svg>
          </div>
          <p className="mt-3.5 font-display text-base font-bold text-plum-600 dark:text-cream-100">Belum ada klaim</p>
          <p className="mx-auto mt-1 max-w-[240px] text-[12.5px] text-plum-400 dark:text-cream-100/60">
            Buat klaim pertamamu dengan mengunggah struk pembelian dan mulai kumpulkan reward.
          </p>
          <Link href="/customer/claims/new" className="btn-gold mx-auto mt-4 max-w-[220px]">
            Buat Klaim Pertama
          </Link>
        </div>
      )}
    </div>
  );
}
