"use client";

import { useState } from "react";
import { AgentForm } from "./AgentForm";
import { DeleteAgentButton } from "./DeleteAgentButton";
import { Button } from "@/components/ui/Button";

type Branch = { id: string; name: string };
type Agent = { id: string; name: string; username: string; whatsapp: string; branch_id: string | null; branchName: string | null };

export function AgentRow({ agent, branches }: { agent: Agent; branches: Branch[] }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="px-2.5 py-4">
        <AgentForm mode="edit" agent={agent} branches={branches} onDone={() => setEditing(false)} />
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="mt-2 text-xs font-semibold text-plum-400 underline dark:text-cream-100/60"
        >
          Batal edit
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 px-2.5 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-plum-600 dark:text-cream-100">{agent.name}</p>
        <p className="truncate text-xs text-plum-400 dark:text-cream-100/60">
          @{agent.username} · {agent.branchName ?? "Belum ada cabang"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <DeleteAgentButton agentId={agent.id} agentName={agent.name} />
      </div>
    </div>
  );
}
