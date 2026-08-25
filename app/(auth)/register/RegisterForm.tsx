"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerCustomer } from "../actions";
import { Input, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

type ResolvedBranch = { code: string; name: string; token: string };

export function RegisterForm({
  resolvedBranch,
  branchNotice,
}: {
  resolvedBranch: ResolvedBranch | null;
  branchNotice: string | null;
}) {
  const [state, formAction, pending] = useActionState(registerCustomer, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {branchNotice && (
        <div className="notice notice-warn" role="alert">
          <span>{branchNotice}</span>
        </div>
      )}

      {resolvedBranch && (
        <div>
          <Label htmlFor="branch">Cabang</Label>
          <input type="hidden" name="branchCode" value={resolvedBranch.code} />
          <input type="hidden" name="branchToken" value={resolvedBranch.token} />
          <p
            id="branch"
            className="input flex items-center bg-cream-100 text-plum-600 dark:bg-plum-500/20 dark:text-cream-100"
          >
            {resolvedBranch.name}
          </p>
          <p className="mt-1.5 text-xs text-plum-400 dark:text-cream-100/60">
            Terdeteksi dari QR cabang, tidak bisa diubah.
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="name">Nama Lengkap</Label>
        <Input id="name" name="name" required minLength={3} placeholder="Nama sesuai identitas" />
      </div>
      <div>
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" required minLength={3} pattern="[a-z0-9_]+" placeholder="Username unik" />
      </div>
      <div>
        <Label htmlFor="whatsapp">Nomor WhatsApp</Label>
        <Input id="whatsapp" name="whatsapp" required placeholder="+62812xxxxxxx" />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required minLength={8} />
      </div>

      <label className="flex items-start gap-3 rounded-2xl border-[1.5px] border-cream-200 p-3.5 text-sm dark:border-plum-500/40">
        <input type="checkbox" name="agreedSk" required className="mt-1 h-[19px] w-[19px] accent-gold-500" />
        <span>
          <span className="block font-bold text-plum-600 dark:text-cream-100">
            Saya telah membaca dan menyetujui Syarat &amp; Ketentuan
          </span>
          <span className="mt-0.5 block text-[11.5px] text-plum-400 dark:text-cream-100/70">
            Termasuk wajib mention @aurorahijab.co, konten orisinal, dan penggunaan voucher hanya untuk Series
            Sarimbit di cabang tempat klaim.{" "}
            <Link href="/#sk" className="font-bold text-gold-500 underline underline-offset-2">
              Baca S&amp;K
            </Link>
          </span>
        </span>
      </label>

      {state?.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-danger/40 dark:bg-danger-bg/20 dark:text-danger"
        >
          {state.error}
        </div>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Memproses..." : "Daftar & Lanjutkan"}
      </Button>
    </form>
  );
}
