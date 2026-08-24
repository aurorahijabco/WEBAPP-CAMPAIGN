"use client";

import { useTransition } from "react";
import { toggleBranchActive } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

export function BranchToggle({ branchId, active }: { branchId: string; active: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => toggleBranchActive(branchId, !active))}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-semibold",
        active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
      )}
    >
      {active ? "Aktif" : "Nonaktif"}
    </button>
  );
}
