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
      {state?.error && <p className="text-xs font-semibold text-danger">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" name="status" value="VALID" size="sm" disabled={pending}>
          ✓ VALID
        </Button>
        <Button
          type="submit"
          name="status"
          value="INVALID"
          variant="danger"
          size="sm"
          disabled={pending}
        >
          ✕ INVALID
        </Button>
      </div>
    </form>
  );
}
