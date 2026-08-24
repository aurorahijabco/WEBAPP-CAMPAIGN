"use client";

import { useTransition } from "react";
import { toggleBranchActive } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

export function BranchToggle({ branchId, active }: { branchId: string; active: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => {
  startTransition(() => {
    void toggleBranchActive(branchId, !active)
  })
}}
      className={cn(
        "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold",
        active ? "bg-success-bg text-success" : "bg-cream-100 text-plum-400 dark:bg-plum-500/20 dark:text-cream-100/60"
      )}
    >
      {active ? "Aktif" : "Nonaktif"}
    </button>
  );
}
