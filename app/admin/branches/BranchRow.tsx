"use client";

import { useState } from "react";
import { BranchForm } from "./BranchForm";
import { BranchToggle } from "./BranchToggle";
import { DeleteBranchButton } from "./DeleteBranchButton";
import { Button } from "@/components/ui/Button";

type Branch = { id: string; name: string; code: string | null; qr_code: string | null; address: string | null; active: boolean };

export function BranchRow({ branch }: { branch: Branch }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="px-2.5 py-4">
        <BranchForm mode="edit" branch={branch} onDone={() => setEditing(false)} />
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
    <div className="flex flex-wrap items-center justify-between gap-3 px-2.5 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-plum-600 dark:text-cream-100">{branch.name}</p>
        <p className="truncate text-xs text-plum-400 dark:text-cream-100/60">
          {branch.code ?? "—"} · {branch.address ?? "Alamat belum diisi"}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <BranchToggle branchId={branch.id} active={branch.active} />
        <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <DeleteBranchButton branchId={branch.id} branchName={branch.name} />
      </div>
    </div>
  );
}
