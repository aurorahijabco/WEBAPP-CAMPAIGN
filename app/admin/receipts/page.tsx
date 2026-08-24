import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
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
      <h1 className="font-display text-2xl text-plum-600">Verifikasi Struk (HOLD)</h1>
      <div className="space-y-4">
        {withUrls.map((b) => (
          <Card key={b.id}>
            <div className="flex flex-col md:flex-row gap-4">
              {b.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.photoUrl} alt="Struk" className="w-full md:w-48 rounded-2xl object-cover border border-cream-200" />
              )}
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-plum-600">{b.profiles?.name} ({b.profiles?.whatsapp})</p>
                <p className="text-xs text-plum-400">{b.branches?.name} · {formatDate(b.created_at)}</p>
                <p className="text-sm font-semibold">{formatIDR(b.amount)}</p>
                <ul className="text-xs text-plum-400 list-disc pl-4">
                  {(b.items ?? []).map((it: any, i: number) => (
                    <li key={i}>{it.name} x{it.qty} — {formatIDR(it.price)}</li>
                  ))}
                </ul>
                <ReviewBillForm billId={b.id} />
              </div>
            </div>
          </Card>
        ))}
        {!withUrls.length && <Card className="text-center text-sm text-plum-400">Tidak ada struk yang perlu diverifikasi.</Card>}
      </div>
    </div>
  );
}
