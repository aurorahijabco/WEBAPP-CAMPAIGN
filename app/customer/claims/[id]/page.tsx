import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { formatIDR, formatDate } from "@/lib/utils";
import { REWARD_TIER_LABELS, ContentType } from "@/types/domain";
import { ContentForm } from "./ContentForm";

const TIERS: ContentType[] = ["story", "feed_photo", "feed_reels"];

export default async function ClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = createAdminClient();

  const { data: claim } = await supabase
    .from("claims")
    .select("*, branches(name), bills(*)")
    .eq("id", id)
    .eq("customer_id", user.id)
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
    <div className="space-y-6 pb-4">
      <div>
        <h1 className="font-display text-2xl text-plum-600 dark:text-cream-100">Detail Klaim</h1>
        <p className="text-sm text-plum-400 dark:text-cream-100/70">{(claim as any).branches?.name}</p>
      </div>

      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-plum-600 dark:text-cream-100">Status Struk</p>
          <Badge status={claim.purchase_status} />
        </div>
        <div className="kv">
          <p className="kv-k">Nominal</p>
          <p className="kv-v">{formatIDR(bill?.amount ?? 0)}</p>
        </div>
        <div className="kv">
          <p className="kv-k">Diajukan</p>
          <p className="kv-v">{formatDate(claim.created_at)}</p>
        </div>

        {claim.flagged && (
          <div className="notice notice-danger mt-3">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <span>{claim.flag_reason ?? "Klaim ini ditandai untuk review tambahan oleh admin."}</span>
          </div>
        )}
        {claim.purchase_status === "HOLD" && (
          <div className="notice notice-warn mt-3">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
            <span>Struk sedang diverifikasi oleh tim Aurora Hijab.</span>
          </div>
        )}
        {claim.purchase_status === "INVALID" && (
          <div className="notice notice-danger mt-3">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
            <span>Struk ditolak. Hubungi CS Aurora Hijab jika ini keliru.</span>
          </div>
        )}
      </div>

      {voucher && (
        <div className="ticket">
          <div className="flex items-start justify-between gap-2.5 px-[18px] pb-3.5 pt-[18px]">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-rose-200">Voucher Kamu</p>
            <Badge status={voucher.status} />
          </div>
          <p className="px-[18px] pb-[18px] font-mono text-2xl font-bold text-gold-400">{formatIDR(voucher.value)}</p>
          <div className="ticket-perf" />
          <p className="px-[18px] py-3.5 font-mono text-[13px] text-white/90">{voucher.code}</p>
        </div>
      )}

      <div>
        <p className="section-title mb-3">Progress Konten</p>
        <div className="space-y-3">
          {TIERS.map((tier) => {
            const tierSubs = submissions?.filter((s) => s.type === tier) ?? [];
            const latest = tierSubs[0];
            const approved = tierSubs.some((s) => s.status === "APPROVED");
            const canSubmit = claim.purchase_status !== "INVALID" && !approved;

            return (
              <div key={tier} className="card">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-bold text-plum-600 dark:text-cream-100">{REWARD_TIER_LABELS[tier]}</p>
                  {latest ? (
                    <Badge status={latest.status} />
                  ) : (
                    <span className="text-xs font-semibold text-plum-400 dark:text-cream-100/50">Belum diajukan</span>
                  )}
                </div>

                {tierSubs.length > 0 && (
                  <ul className="mb-3 space-y-1.5">
                    {tierSubs.map((s) => (
                      <li key={s.id} className="text-xs text-plum-400 dark:text-cream-100/60">
                        <a href={s.url} target="_blank" rel="noreferrer" className="break-all font-medium text-plum-600 underline dark:text-cream-100">
                          {s.url}
                        </a>{" "}
                        — {s.platform} · {formatDate(s.submitted_at)}
                        {s.status === "REJECTED" && s.reason && (
                          <p className="mt-0.5 font-semibold text-danger">Alasan: {s.reason}</p>
                        )}
                        {s.status === "HOLD" && s.reason && (
                          <p className="mt-0.5 font-semibold text-warn">Catatan: {s.reason}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {canSubmit && <ContentForm claimId={claim.id} type={tier} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
