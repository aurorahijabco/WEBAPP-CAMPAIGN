import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatIDR, formatDate } from "@/lib/utils";
import { REWARD_TIER_LABELS, ContentType } from "@/types/domain";
import { ContentForm } from "./ContentForm";

const TIERS: ContentType[] = ["story", "feed_photo", "feed_reels"];

export default async function ClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: claim } = await supabase
    .from("claims")
    .select("*, branches(name), bills(*)")
    .eq("id", id)
    .eq("customer_id", user!.id)
    .single();

  if (!claim) notFound();

  const { data: submissions } = await supabase
    .from("content_submissions")
    .select("*")
    .eq("claim_id", id)
    .order("submitted_at", { ascending: false });

  const { data: voucher } = await supabase
    .from("vouchers")
    .select("*")
    .eq("claim_id", id)
    .maybeSingle();

  const bill = (claim as any).bills;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-plum-600">Detail Klaim</h1>
        <p className="text-sm text-plum-400">{(claim as any).branches?.name}</p>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-plum-600">Status Struk</p>
          <Badge status={claim.purchase_status} />
        </div>
        <p className="text-xs text-plum-400">Nominal: {formatIDR(bill?.amount ?? 0)}</p>
        <p className="text-xs text-plum-400">Diajukan: {formatDate(claim.created_at)}</p>
        {claim.flagged && (
          <p className="mt-2 text-xs text-red-600">
            ⚠ {claim.flag_reason ?? "Klaim ini ditandai untuk review tambahan oleh admin."}
          </p>
        )}
        {claim.purchase_status === "HOLD" && (
          <p className="mt-2 text-xs text-amber-600">Struk sedang diverifikasi oleh tim Aurora Hijab.</p>
        )}
        {claim.purchase_status === "INVALID" && (
          <p className="mt-2 text-xs text-red-600">Struk ditolak. Hubungi CS Aurora Hijab jika ini keliru.</p>
        )}
      </Card>

      {voucher && (
        <Card className="bg-gold-400/10 border-gold-400">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-plum-600">Voucher Kamu</p>
            <Badge status={voucher.status} />
          </div>
          <p className="font-display text-2xl text-plum-600">{formatIDR(voucher.value)}</p>
          <p className="text-xs text-plum-400">Kode: {voucher.code}</p>
        </Card>
      )}

      <div>
        <h2 className="font-display text-lg text-plum-600 mb-3">Progress Konten</h2>
        <div className="space-y-3">
          {TIERS.map((tier) => {
            const tierSubs = submissions?.filter((s) => s.type === tier) ?? [];
            const latest = tierSubs[0];
            const approved = tierSubs.some((s) => s.status === "APPROVED");
            const canSubmit = claim.purchase_status !== "INVALID" && !approved;

            return (
              <Card key={tier}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-plum-600">{REWARD_TIER_LABELS[tier]}</p>
                  {latest ? <Badge status={latest.status} /> : <span className="text-xs text-plum-400">Belum diajukan</span>}
                </div>

                {tierSubs.length > 0 && (
                  <ul className="mb-3 space-y-1">
                    {tierSubs.map((s) => (
                      <li key={s.id} className="text-xs text-plum-400">
                        <a href={s.url} target="_blank" rel="noreferrer" className="underline break-all">
                          {s.url}
                        </a>{" "}
                        — {s.platform} · {formatDate(s.submitted_at)}
                        {s.status === "REJECTED" && s.reason && (
                          <p className="text-red-600 mt-0.5">Alasan: {s.reason}</p>
                        )}
                        {s.status === "HOLD" && s.reason && (
                          <p className="text-amber-600 mt-0.5">Catatan: {s.reason}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {canSubmit && <ContentForm claimId={claim.id} type={tier} />}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
