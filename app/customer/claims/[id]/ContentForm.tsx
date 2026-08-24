"use client";

import { useActionState } from "react";
import { submitContent } from "@/app/customer/actions";
import { Input, Label, Select, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ContentType } from "@/types/domain";

export function ContentForm({ claimId, type }: { claimId: string; type: ContentType }) {
  const [state, formAction, pending] = useActionState(submitContent, undefined);

  return (
    <form action={formAction} className="space-y-2 border-t border-cream-200 pt-3 mt-1">
      <input type="hidden" name="claimId" value={claimId} />
      <input type="hidden" name="type" value={type} />

      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor={`platform-${type}`}>Platform</Label>
          <Select id={`platform-${type}`} name="platform" required defaultValue="">
            <option value="" disabled>Pilih...</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor={`url-${type}`}>Link Konten</Label>
        <Input id={`url-${type}`} name="url" type="url" placeholder="https://..." required />
      </div>

      <FieldError message={state?.error} />
      {state?.success && <p className="text-xs text-green-600 font-medium">{state.success}</p>}

      <Button type="submit" variant="outline" disabled={pending} className="w-full text-xs py-2">
        {pending ? "Mengirim..." : "Submit Konten"}
      </Button>
    </form>
  );
}
