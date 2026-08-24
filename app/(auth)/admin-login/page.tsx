"use client";

import { useActionState } from "react";
import { loginAdmin } from "../actions";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAdmin, undefined);

  return (
    <main className="min-h-screen bg-plum-900 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md card">
        <h1 className="font-display text-2xl text-plum-600 mb-1">Login Super Admin</h1>
        <p className="text-sm text-plum-400 mb-6">Akses terbatas untuk tim internal Aurora Hijab.</p>

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
            {pending ? "Memproses..." : "Masuk sebagai Admin"}
          </Button>
        </form>
      </div>
    </main>
  );
}
