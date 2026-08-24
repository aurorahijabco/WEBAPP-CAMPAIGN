import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { formatIDR, formatDate } from "@/lib/utils";

export default async function AdminVouchersPage() {
  const supabase = await createClient();
  const { data: vouchers } = await supabase
    .from("vouchers")
    .select("*, profiles!vouchers_customer_id_fkey(name), branches(name)")
    .order("created_at", { ascending: false })
    .limit(300);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-plum-600 dark:text-cream-100">Monitor Voucher &amp; Redeem</h1>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream-200 text-left text-xs text-plum-400 dark:border-plum-500/30 dark:text-cream-100/60">
              <th className="py-3 pl-4 pr-3">Kode</th>
              <th className="py-3 pr-3">Customer</th>
              <th className="py-3 pr-3">Cabang</th>
              <th className="py-3 pr-3">Nilai</th>
              <th className="py-3 pr-3">Status</th>
              <th className="py-3 pr-4">Ditukar</th>
            </tr>
          </thead>
          <tbody>
            {vouchers?.map((v: any) => (
              <tr key={v.id} className="border-b border-cream-100 dark:border-plum-500/20">
                <td className="py-2.5 pl-4 pr-3 font-mono font-semibold text-plum-600 dark:text-cream-100">{v.code}</td>
                <td className="py-2.5 pr-3 text-plum-600 dark:text-cream-100">{v.profiles?.name}</td>
                <td className="py-2.5 pr-3 text-plum-400 dark:text-cream-100/60">{v.branches?.name}</td>
                <td className="py-2.5 pr-3 text-plum-600 dark:text-cream-100">{formatIDR(v.value)}</td>
                <td className="py-2.5 pr-3"><Badge status={v.status} /></td>
                <td className="py-2.5 pr-4 text-xs text-plum-400 dark:text-cream-100/60">
                  {v.redeemed_at ? formatDate(v.redeemed_at) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!vouchers?.length && <p className="py-8 text-center text-sm text-plum-400 dark:text-cream-100/60">Belum ada voucher.</p>}
      </div>
    </div>
  );
}
