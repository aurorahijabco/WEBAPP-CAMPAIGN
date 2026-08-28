"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginCustomer } from "../actions";
import { Input, Label, FieldError, PasswordInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { AuthShell } from "@/components/AuthShell";
import { ExpiredNotice } from "@/components/ExpiredNotice";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginCustomer, undefined);

  return (
    <AuthShell
      title="Selamat Datang"
      subtitle="Masuk dengan username & password akunmu."
      footer={
        <>
          Belum punya akun?{" "}
          <Link href="/register" className="font-bold text-gold-500 underline underline-offset-2">
            Daftar di sini
          </Link>
        </>
      }
    >
      <ExpiredNotice />
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="username">Username</Label>
          <Input id="username" name="username" required autoComplete="username" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" name="password" required />
        </div>

        <FieldError message={state?.error} />

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Memproses..." : "Masuk"}
        </Button>
      </form>
    </AuthShell>
  );
}
