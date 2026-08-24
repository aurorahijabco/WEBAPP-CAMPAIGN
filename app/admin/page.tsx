import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { formatIDR } from "@/lib/utils";

export default async function AdminOverview() {
  const supabase = await createClient();

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
      <h1 className="font-display text-2xl text-plum-600">Overview Campaign</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><p className="text-xs text-plum-400">Total Klaim</p><p className="font-display text-2xl">{claimCount ?? 0}</p></Card>
        <Card><p className="text-xs text-plum-400">Struk Perlu Verifikasi</p><p className="font-display text-2xl">{holdBills ?? 0}</p></Card>
        <Card><p className="text-xs text-plum-400">Konten Pending</p><p className="font-display text-2xl">{pendingContent ?? 0}</p></Card>
        <Card><p className="text-xs text-plum-400">Voucher Aktif</p><p className="font-display text-2xl">{active}</p></Card>
      </div>

      <Card>
        <p className="text-xs text-plum-400">Total Nilai Voucher Ditukarkan</p>
        <p className="font-display text-3xl text-plum-600">{formatIDR(totalRedeemedValue)}</p>
        <p className="text-xs text-plum-400 mt-1">{redeemed.length} voucher telah ditukarkan</p>
      </Card>
    </div>
  );
}
