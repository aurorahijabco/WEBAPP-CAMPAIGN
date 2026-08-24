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
    <form action={formAction} className="mt-3 space-y-2 border-t border-cream-200 pt-3">
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
      <Textarea name="reason" defaultValue={reasonPreset} placeholder="Alasan (wajib untuk HOLD/REJECTED)" className="min-h-[60px] text-xs" />

      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="status" value="APPROVED" disabled={pending} className="text-xs px-3 py-2">
          ✓ Approve
        </Button>
        <Button type="submit" name="status" value="HOLD" variant="outline" disabled={pending} className="text-xs px-3 py-2 border-amber-400 text-amber-600">
          ⏸ Hold
        </Button>
        <Button type="submit" name="status" value="REJECTED" variant="outline" disabled={pending} className="text-xs px-3 py-2 border-red-400 text-red-600">
          ✕ Reject
        </Button>
      </div>
    </form>
  );
}
