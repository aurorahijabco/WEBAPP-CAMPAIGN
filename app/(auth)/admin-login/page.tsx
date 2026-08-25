"use client";

import { useActionState } from "react";
import { loginAdmin } from "../actions";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { AuthShell } from "@/components/AuthShell";
import { ExpiredNotice } from "@/components/ExpiredNotice";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAdmin, undefined);

  return (
    <AuthShell
      title="Login Super Admin"
      subtitle="Akses terbatas untuk tim internal Aurora Hijab."
      eyebrow="Portal Admin"
    >
      <ExpiredNotice />
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="username">Username</Label>
          <Input id="username" name="username" required autoComplete="username" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required />
        </div>

        <FieldError message={state?.error} />

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Memproses..." : "Masuk sebagai Admin"}
        </Button>
      </form>
    </AuthShell>
  );
}
