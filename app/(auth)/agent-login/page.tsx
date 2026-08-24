"use client";

import { useActionState } from "react";
import { loginAgent } from "../actions";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default function AgentLoginPage() {
  const [state, formAction, pending] = useActionState(loginAgent, undefined);

  return (
    <main className="min-h-screen bg-plum-600 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md card">
        <h1 className="font-display text-2xl text-plum-600 mb-1">Login Agen Cabang</h1>
        <p className="text-sm text-plum-400 mb-6">Khusus akun Agen Aurora Hijab per cabang.</p>

        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
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
      </div>
    </main>
  );
}
