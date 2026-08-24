"use client";

import { useActionState } from "react";
import { updateProfile } from "./actions";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Profile } from "@/types/domain";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(updateProfile, undefined);

  return (
    <div className="card sm:p-7">
      <form action={formAction} className="space-y-4">
        <div>
          <Label>Username</Label>
          <Input value={profile.username} disabled className="opacity-60" />
        </div>
        <div>
          <Label htmlFor="name">Nama Lengkap</Label>
          <Input id="name" name="name" defaultValue={profile.name} required minLength={3} />
        </div>
        <div>
          <Label htmlFor="whatsapp">Nomor WhatsApp</Label>
          <Input id="whatsapp" name="whatsapp" defaultValue={profile.whatsapp} required />
        </div>

        <FieldError message={state?.error} />
        {state?.success && <p className="text-xs font-semibold text-success">{state.success}</p>}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </form>
    </div>
  );
}
