"use client";

import { useState } from "react";
import { BranchForm } from "./BranchForm";
import { Button } from "@/components/ui/Button";

export function AddBranchCard() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)} className="w-full">
        + Tambah Cabang
      </Button>
    );
  }

  return (
    <div className="card sm:p-7">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-display text-lg text-plum-600 dark:text-cream-100">Tambah Cabang Baru</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-semibold text-plum-400 underline dark:text-cream-100/60"
        >
          Tutup
        </button>
      </div>
      <BranchForm mode="create" onDone={() => setOpen(false)} />
    </div>
  );
}
