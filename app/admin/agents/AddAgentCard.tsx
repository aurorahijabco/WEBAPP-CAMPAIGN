"use client";

import { useState } from "react";
import { AgentForm } from "./AgentForm";
import { Button } from "@/components/ui/Button";

export function AddAgentCard({ branches }: { branches: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)} className="w-full">
        + Tambah Agent
      </Button>
    );
  }

  return (
    <div className="card sm:p-7">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-display text-lg text-plum-600 dark:text-cream-100">Tambah Agent Baru</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-semibold text-plum-400 underline dark:text-cream-100/60"
        >
          Tutup
        </button>
      </div>
      <AgentForm mode="create" branches={branches} onDone={() => setOpen(false)} />
    </div>
  );
}
