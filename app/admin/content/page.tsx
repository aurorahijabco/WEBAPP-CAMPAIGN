import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";
import { REWARD_TIER_LABELS } from "@/types/domain";
import { ReviewContentForm } from "./ReviewContentForm";

export default async function AdminContentPage() {
  const supabase = createAdminClient();
  const { data: submissions } = await supabase
    .from("content_submissions")
    .select("*, claims(customer_id, branch_id, profiles!claims_customer_id_fkey(name), branches(name))")
    .eq("status", "PENDING")
    .order("submitted_at", { ascending: true });

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-plum-600 dark:text-cream-100">Review Konten (PENDING)</h1>
      <div className="space-y-4">
        {submissions?.map((s: any) => (
          <div key={s.id} className="card">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-sm font-bold text-plum-600 dark:text-cream-100">
                {s.claims?.profiles?.name} · {REWARD_TIER_LABELS[s.type as keyof typeof REWARD_TIER_LABELS]}
              </p>
              <span className="text-xs text-plum-400 dark:text-cream-100/60">{s.claims?.branches?.name}</span>
            </div>
            <p className="mb-2 text-xs text-plum-400 dark:text-cream-100/60">
              {s.platform} · {formatDate(s.submitted_at)}
            </p>
            <a href={s.url} target="_blank" rel="noreferrer" className="break-all text-sm text-plum-600 underline dark:text-cream-100">
              {s.url}
            </a>
            <ReviewContentForm submissionId={s.id} />
          </div>
        ))}
        {!submissions?.length && <div className="empty card">Tidak ada konten yang perlu direview.</div>}
      </div>
    </div>
  );
}
