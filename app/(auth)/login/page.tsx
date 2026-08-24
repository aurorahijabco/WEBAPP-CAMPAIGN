"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginCustomer } from "../actions";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { AuthShell } from "@/components/AuthShell";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginCustomer, undefined);

  return (
    <AuthShell
      title="Selamat Datang"
      subtitle="Masuk dengan email & password akunmu."
      footer={
        <>
          Belum punya akun?{" "}
          <Link href="/register" className="font-bold text-gold-500 underline underline-offset-2">
            Daftar di sini
          </Link>
        </>
      }
    >
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

      <div className="mt-5 flex justify-center gap-4 text-xs text-plum-400 dark:text-cream-100/60">
        <Link href="/agent-login" className="underline underline-offset-2">Login Agen</Link>
        <Link href="/admin-login" className="underline underline-offset-2">Login Admin</Link>
      </div>
    </AuthShell>
  );
}
