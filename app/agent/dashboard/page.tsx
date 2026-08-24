import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
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
      <h1 className="font-display text-2xl text-plum-600">Dashboard Cabang</h1>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs text-plum-400">Voucher Aktif</p>
          <p className="font-display text-3xl text-plum-600">{active.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-plum-400">Sudah Ditukar</p>
          <p className="font-display text-3xl text-plum-600">{redeemed.length}</p>
        </Card>
      </div>

      <Link href="/agent/redeem" className="btn-primary w-full block text-center">
        🎟️ Redeem Voucher
      </Link>

      <div>
        <h2 className="font-display text-lg text-plum-600 mb-3">Voucher Aktif di Cabang Ini</h2>
        <div className="space-y-2">
          {active.length ? (
            active.map((v: any) => (
              <Card key={v.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-plum-600">{v.code}</p>
                  <p className="text-xs text-plum-400">{v.profiles?.name} · {formatDate(v.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-plum-600">{formatIDR(v.value)}</p>
                  <Badge status={v.status} />
                </div>
              </Card>
            ))
          ) : (
            <Card className="text-center text-sm text-plum-400">Belum ada voucher aktif.</Card>
          )}
        </div>
      </div>
    </div>
  );
}
