import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatIDR, formatDate } from "@/lib/utils";

export default async function AdminClaimsPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase
    .from("claims")
    .select("*, profiles!claims_customer_id_fkey(name, whatsapp), branches(name), bills(amount, status)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-plum-600">Semua Klaim</h1>
      <div className="space-y-2">
        {claims?.map((c: any) => (
          <Card key={c.id} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-plum-600">{c.profiles?.name} · {c.branches?.name}</p>
              <p className="text-xs text-plum-400">{formatDate(c.created_at)} · {formatIDR(c.bills?.amount ?? 0)}</p>
              {c.flagged && <p className="text-xs text-red-600 mt-0.5">⚠ {c.flag_reason}</p>}
            </div>
            <Badge status={c.purchase_status} />
          </Card>
        ))}
        {!claims?.length && <Card className="text-center text-sm text-plum-400">Belum ada klaim.</Card>}
      </div>
    </div>
  );
}
