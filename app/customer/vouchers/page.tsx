import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { CopyCodeButton } from "./CopyCodeButton";

export default async function VouchersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: vouchers } = await supabase
    .from("vouchers")
    .select("*, branches(name)")
    .eq("customer_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-plum-600">Voucher Saya</h1>

      {!vouchers?.length && (
        <div className="card text-center text-sm text-plum-400">
          Belum ada voucher. Selesaikan klaim dan konten untuk mendapatkan voucher.
        </div>
      )}

      <div className="space-y-4">
        {vouchers?.map((v: any) => (
          <div key={v.id} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-plum-600 to-plum-500 text-cream-50 p-5 shadow-md">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gold-400/20" />
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-widest text-gold-400">Aurora Hijab Voucher</p>
              <Badge status={v.status} />
            </div>
            <p className="font-display text-3xl mb-1">{formatIDR(v.value)}</p>
            <p className="text-xs text-cream-100/80 mb-4">
              Berlaku untuk Series Sarimbit di {v.branches?.name}
            </p>

            <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
              <code className="tracking-widest text-lg font-semibold">{v.code}</code>
              <CopyCodeButton code={v.code} />
            </div>

            {v.status === "REDEEMED" && (
              <p className="mt-3 text-xs text-cream-100/80">
                Ditukarkan {formatDate(v.redeemed_at)} sebesar {formatIDR(v.redeemed_amount ?? v.value)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
