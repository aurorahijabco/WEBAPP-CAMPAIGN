"use client";

import { useActionState, useState } from "react";
import { deleteBranch } from "./actions";
import { Button } from "@/components/ui/Button";

export function DeleteBranchButton({ branchId, branchName }: { branchId: string; branchName: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(deleteBranch, undefined);

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
    <div className="flex flex-col items-end gap-1.5">
      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="branchId" value={branchId} />
        <span className="text-xs font-semibold text-plum-500 dark:text-cream-100/80">Hapus {branchName}?</span>
        <Button type="submit" variant="danger" size="sm" disabled={pending}>
          {pending ? "..." : "Ya, hapus"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(false)} disabled={pending}>
          Batal
        </Button>
      </form>
      {state?.error && <span className="max-w-[260px] text-right text-xs font-semibold text-danger">{state.error}</span>}
    </div>
  );
}
