"use client";

import { useActionState, useState } from "react";
import { reviewContent } from "@/app/admin/actions";
import { Textarea, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { REJECT_REASON_PRESETS } from "@/types/domain";

export function ReviewContentForm({ submissionId }: { submissionId: string }) {
  const [state, formAction, pending] = useActionState(reviewContent, undefined);
  const [reasonPreset, setReasonPreset] = useState("");

  return (
    <form action={formAction} className="mt-3 space-y-2 border-t border-cream-200 pt-3 dark:border-plum-500/30">
      <input type="hidden" name="submissionId" value={submissionId} />

      <Select
        value={reasonPreset}
        onChange={(e) => setReasonPreset(e.target.value)}
        className="text-xs"
      >
        <option value="">Pilih alasan preset (untuk HOLD/REJECTED)...</option>
        {REJECT_REASON_PRESETS.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </Select>
      {/* Keyed on reasonPreset so picking a preset actually re-mounts (and
          re-populates) this uncontrolled textarea — defaultValue alone does
          not update an already-mounted input. */}
      <Textarea
        key={reasonPreset}
        name="reason"
        defaultValue={reasonPreset}
        placeholder="Alasan (wajib untuk HOLD/REJECTED)"
        className="min-h-[60px] text-xs"
      />

      {state?.error && <p className="text-xs font-semibold text-danger">{state.error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="status" value="APPROVED" size="sm" disabled={pending}>
          ✓ Approve
        </Button>
        <Button type="submit" name="status" value="HOLD" variant="outline" size="sm" disabled={pending} className="border-warn/50 text-warn">
          ⏸ Hold
        </Button>
        <Button type="submit" name="status" value="REJECTED" variant="danger" size="sm" disabled={pending}>
          ✕ Reject
        </Button>
      </div>
    </form>
  );
}
