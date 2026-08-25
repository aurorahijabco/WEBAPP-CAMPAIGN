"use client";

import { useActionState, useState } from "react";
import { deleteAgent } from "./actions";
import { Button } from "@/components/ui/Button";

export function DeleteAgentButton({ agentId, agentName }: { agentId: string; agentName: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(deleteAgent, undefined);

  if (state?.success) {
    return <p className="text-xs font-semibold text-success">Dihapus.</p>;
  }

  if (!confirming) {
    return (
      <Button type="button" variant="danger" size="sm" onClick={() => setConfirming(true)}>
        Hapus
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="agentId" value={agentId} />
      <span className="text-xs font-semibold text-plum-500 dark:text-cream-100/80">Hapus {agentName}?</span>
      <Button type="submit" variant="danger" size="sm" disabled={pending}>
        {pending ? "..." : "Ya, hapus"}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(false)} disabled={pending}>
        Batal
      </Button>
      {state?.error && <span className="text-xs font-semibold text-danger">{state.error}</span>}
    </form>
  );
}
