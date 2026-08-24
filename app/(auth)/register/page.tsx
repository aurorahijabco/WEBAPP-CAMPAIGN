"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerCustomer } from "../actions";
import { Input, Label, FieldError } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerCustomer, undefined);

  return (
    <main className="min-h-screen bg-cream-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md card">
        <h1 className="font-display text-2xl text-plum-600 mb-1">Daftar Akun</h1>
        <p className="text-sm text-plum-400 mb-6">Buat akun untuk mulai klaim voucher Aurora Hijab.</p>

        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input id="name" name="name" required minLength={3} />
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" required minLength={3} pattern="[a-z0-9_]+" />
          </div>
          <div>
            <Label htmlFor="whatsapp">Nomor WhatsApp</Label>
            <Input id="whatsapp" name="whatsapp" required placeholder="+62812xxxxxxx" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={8} />
          </div>
          <label className="flex items-start gap-2 text-sm text-plum-500">
            <input type="checkbox" name="agreedSk" required className="mt-1" />
            Saya menyetujui{" "}
            <Link href="/#terms" className="underline text-plum-600">
              Syarat &amp; Ketentuan
            </Link>{" "}
            campaign Aurora Hijab.
          </label>

          <FieldError message={state?.error} />

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Memproses..." : "Daftar"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-plum-400">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-plum-600 font-medium underline">
            Masuk
          </Link>
        </p>
      </div>
    </main>
  );
}
