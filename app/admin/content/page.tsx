import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import { REWARD_TIER_LABELS } from "@/types/domain";
import { ReviewContentForm } from "./ReviewContentForm";

export default async function AdminContentPage() {
  const supabase = await createClient();
  const { data: submissions } = await supabase
    .from("content_submissions")
    .select("*, claims(customer_id, branch_id, profiles!claims_customer_id_fkey(name), branches(name))")
    .eq("status", "PENDING")
    .order("submitted_at", { ascending: true });

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-plum-600">Review Konten (PENDING)</h1>
      <div className="space-y-4">
        {submissions?.map((s: any) => (
          <Card key={s.id}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-plum-600">
                {s.claims?.profiles?.name} · {REWARD_TIER_LABELS[s.type as keyof typeof REWARD_TIER_LABELS]}
              </p>
              <span className="text-xs text-plum-400">{s.claims?.branches?.name}</span>
            </div>
            <p className="text-xs text-plum-400 mb-2">
              {s.platform} · {formatDate(s.submitted_at)}
            </p>
            <a href={s.url} target="_blank" rel="noreferrer" className="text-sm text-plum-600 underline break-all">
              {s.url}
            </a>
            <ReviewContentForm submissionId={s.id} />
          </Card>
        ))}
        {!submissions?.length && <Card className="text-center text-sm text-plum-400">Tidak ada konten yang perlu direview.</Card>}
      </div>
    </div>
  );
}
