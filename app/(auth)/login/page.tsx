"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginCustomer } from "../actions";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginCustomer, undefined);

  return (
    <main className="min-h-screen bg-cream-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md card">
        <h1 className="font-display text-2xl text-plum-600 mb-1">Masuk</h1>
        <p className="text-sm text-plum-400 mb-6">Masuk ke akun customer Aurora Hijab kamu.</p>

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
            {pending ? "Memproses..." : "Masuk"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-plum-400">
          Belum punya akun?{" "}
          <Link href="/register" className="text-plum-600 font-medium underline">
            Daftar
          </Link>
        </p>
        <div className="mt-2 flex justify-center gap-4 text-xs text-plum-400">
          <Link href="/agent-login" className="underline">Login Agen</Link>
          <Link href="/admin-login" className="underline">Login Admin</Link>
        </div>
      </div>
    </main>
  );
}
