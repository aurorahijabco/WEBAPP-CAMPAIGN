import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

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
    .select("id, status")
    .eq("customer_id", user!.id);

  const activeVouchers = vouchers?.filter((v) => v.status === "ACTIVE" || v.status === "RESERVED").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-plum-400">Halo,</p>
        <h1 className="font-display text-2xl text-plum-600">{profile?.name ?? "Customer"}</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs text-plum-400">Total Klaim</p>
          <p className="font-display text-3xl text-plum-600">{claims?.length ?? 0}</p>
        </Card>
        <Card>
          <p className="text-xs text-plum-400">Voucher Aktif</p>
          <p className="font-display text-3xl text-plum-600">{activeVouchers}</p>
        </Card>
      </div>

      <Link href="/customer/claims/new" className="btn-primary w-full block text-center">
        + Buat Klaim Baru
      </Link>

      <div>
        <h2 className="font-display text-lg text-plum-600 mb-3">Riwayat Klaim</h2>
        <div className="space-y-3">
          {claims?.length ? (
            claims.map((c: any) => (
              <Link key={c.id} href={`/customer/claims/${c.id}`}>
                <Card className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-plum-600">{c.branches?.name ?? "Cabang"}</p>
                    <p className="text-xs text-plum-400">{formatDate(c.created_at)}</p>
                    {c.flagged && <p className="text-xs text-red-600 mt-1">⚠ Sedang direview admin</p>}
                  </div>
                  <Badge status={c.purchase_status} />
                </Card>
              </Link>
            ))
          ) : (
            <Card className="text-center text-sm text-plum-400">
              Belum ada klaim. Yuk buat klaim pertamamu!
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
