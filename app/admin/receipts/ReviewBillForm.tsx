"use client";

import { useActionState } from "react";
import { reviewBill } from "@/app/admin/actions";
import { Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function ReviewBillForm({ billId }: { billId: string }) {
  const [state, formAction, pending] = useActionState(reviewBill, undefined);

  return (
    <form action={formAction} className="mt-2 space-y-2">
      <input type="hidden" name="billId" value={billId} />
      <Textarea name="note" placeholder="Catatan (opsional)" className="min-h-[60px] text-xs" />
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" name="status" value="VALID" disabled={pending} className="text-xs px-3 py-2">
          ✓ VALID
        </Button>
        <Button type="submit" name="status" value="INVALID" variant="outline" disabled={pending} className="text-xs px-3 py-2 border-red-400 text-red-600">
          ✕ INVALID
        </Button>
      </div>
    </form>
  );
}
