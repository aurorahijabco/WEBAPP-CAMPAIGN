import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
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
      <h1 className="font-display text-2xl text-plum-600">Monitor Voucher &amp; Redeem</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-plum-400 border-b border-cream-200">
              <th className="py-2 pr-3">Kode</th>
              <th className="py-2 pr-3">Customer</th>
              <th className="py-2 pr-3">Cabang</th>
              <th className="py-2 pr-3">Nilai</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Ditukar</th>
            </tr>
          </thead>
          <tbody>
            {vouchers?.map((v: any) => (
              <tr key={v.id} className="border-b border-cream-100">
                <td className="py-2 pr-3 font-medium">{v.code}</td>
                <td className="py-2 pr-3">{v.profiles?.name}</td>
                <td className="py-2 pr-3">{v.branches?.name}</td>
                <td className="py-2 pr-3">{formatIDR(v.value)}</td>
                <td className="py-2 pr-3"><Badge status={v.status} /></td>
                <td className="py-2 pr-3 text-xs text-plum-400">{v.redeemed_at ? formatDate(v.redeemed_at) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!vouchers?.length && <p className="text-center text-sm text-plum-400 py-6">Belum ada voucher.</p>}
      </div>
    </div>
  );
}
