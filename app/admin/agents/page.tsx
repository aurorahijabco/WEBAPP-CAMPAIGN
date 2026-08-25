import { createAdminClient } from "@/lib/supabase/admin";
import { AddAgentCard } from "./AddAgentCard";
import { AgentRow } from "./AgentRow";

export default async function AdminAgentsPage() {
  const supabase = createAdminClient();

  const [{ data: agents }, { data: branches }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, username, whatsapp, branch_id, branches(name)")
      .eq("role", "agent")
      .order("name"),
    supabase.from("branches").select("id, name").order("name"),
  ]);

  const branchList = branches ?? [];
  const agentList = (agents ?? []).map((a: any) => ({
    id: a.id,
    name: a.name,
    username: a.username,
    whatsapp: a.whatsapp,
    branch_id: a.branch_id,
    branchName: a.branches?.name ?? null,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl text-plum-600 dark:text-cream-100">Kelola Agent</h1>
        <p className="mt-1 text-sm text-plum-400 dark:text-cream-100/70">
          Tambah, edit, atau hapus akun Agen Cabang. Agent hanya bisa login dan redeem voucher di cabang yang ditugaskan —
          tidak pernah mendapat akses Super Admin.
        </p>
      </div>

      <AddAgentCard branches={branchList} />

      <div className="card divide-y divide-cream-200 p-2 dark:divide-plum-500/30">
        {agentList.length ? (
          agentList.map((agent) => <AgentRow key={agent.id} agent={agent} branches={branchList} />)
        ) : (
          <p className="empty">Belum ada agent.</p>
        )}
      </div>
    </div>
  );
}
