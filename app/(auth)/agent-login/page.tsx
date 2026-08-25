"use client";

import { useActionState } from "react";
import { loginAgent } from "../actions";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { AuthShell } from "@/components/AuthShell";
import { ExpiredNotice } from "@/components/ExpiredNotice";

export default function AgentLoginPage() {
  const [state, formAction, pending] = useActionState(loginAgent, undefined);

  return (
    <AuthShell
      title="Login Agen Cabang"
      subtitle="Khusus akun Agen Aurora Hijab per cabang."
      eyebrow="Portal Agen"
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
          {pending ? "Memproses..." : "Masuk sebagai Agen"}
        </Button>
      </form>
    </AuthShell>
  );
}
