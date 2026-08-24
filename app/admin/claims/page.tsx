import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/Badge";
import { formatIDR, formatDate } from "@/lib/utils";

export default async function AdminClaimsPage() {
  const supabase = createAdminClient();
  const { data: claims } = await supabase
    .from("claims")
    .select("*, profiles!claims_customer_id_fkey(name, whatsapp), branches(name), bills(amount, status)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-plum-600 dark:text-cream-100">Semua Klaim</h1>
      {claims?.length ? (
        <div className="card divide-y divide-cream-200 p-2 dark:divide-plum-500/30">
          {claims.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between gap-3 px-2.5 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-plum-600 dark:text-cream-100">
                  {c.profiles?.name} · {c.branches?.name}
                </p>
                <p className="text-xs text-plum-400 dark:text-cream-100/60">
                  {formatDate(c.created_at)} · {formatIDR(c.bills?.amount ?? 0)}
                </p>
                {c.flagged && <p className="mt-0.5 text-xs font-semibold text-danger">⚠ {c.flag_reason}</p>}
              </div>
              <Badge status={c.purchase_status} />
            </div>
          ))}
        </div>
      ) : (
        <div className="empty card">Belum ada klaim.</div>
      )}
    </div>
  );
}
