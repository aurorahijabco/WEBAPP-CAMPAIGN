import { createClient } from "@/lib/supabase/server";
import { formatIDR, formatDate } from "@/lib/utils";
import { ReviewBillForm } from "./ReviewBillForm";

export default async function AdminReceiptsPage() {
  const supabase = await createClient();
  const { data: bills } = await supabase
    .from("bills")
    .select("*, profiles!bills_customer_id_fkey(name, whatsapp), branches(name)")
    .eq("status", "HOLD")
    .order("created_at", { ascending: true });

  // Generate short-lived signed URLs for private receipt photos
  const withUrls = await Promise.all(
    (bills ?? []).map(async (b: any) => {
      const { data } = await supabase.storage.from("receipts").createSignedUrl(b.photo_path, 60 * 10);
      return { ...b, photoUrl: data?.signedUrl };
    })
  );

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-plum-600 dark:text-cream-100">Verifikasi Struk (HOLD)</h1>
      <div className="space-y-4">
        {withUrls.map((b) => (
          <div key={b.id} className="card">
            <div className="flex flex-col gap-4 md:flex-row">
              {b.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={b.photoUrl}
                  alt="Struk"
                  className="w-full rounded-2xl border border-cream-200 object-cover dark:border-plum-500/40 md:w-48"
                />
              )}
              <div className="flex-1 space-y-1">
                <p className="text-sm font-bold text-plum-600 dark:text-cream-100">
                  {b.profiles?.name} ({b.profiles?.whatsapp})
                </p>
                <p className="text-xs text-plum-400 dark:text-cream-100/60">
                  {b.branches?.name} · {formatDate(b.created_at)}
                </p>
                <p className="text-sm font-bold text-plum-600 dark:text-cream-100">{formatIDR(b.amount)}</p>
                <ul className="list-disc pl-4 text-xs text-plum-400 dark:text-cream-100/60">
                  {(b.items ?? []).map((it: any, i: number) => (
                    <li key={i}>
                      {it.name} x{it.qty} — {formatIDR(it.price)}
                    </li>
                  ))}
                </ul>
                <ReviewBillForm billId={b.id} />
              </div>
            </div>
          </div>
        ))}
        {!withUrls.length && <div className="empty card">Tidak ada struk yang perlu diverifikasi.</div>}
      </div>
    </div>
  );
}
