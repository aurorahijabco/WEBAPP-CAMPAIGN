import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { RegisterForm } from "./RegisterForm";
import { createAdminClient } from "@/lib/supabase/admin";
import { signBranchCode } from "@/lib/business/branchToken";

/**
 * QR branch tracking: a branch's QR points to `/?branch=CODE`, and the
 * landing page forwards that code onto the "Buat Akun" link as
 * `/register?branch=CODE`. Resolution happens here, server-side, against
 * the database — the query param itself is never trusted as a branch_id.
 */
async function resolveBranch(codeParam: string | undefined) {
  if (!codeParam) return { resolvedBranch: null, branchNotice: null };

  const code = codeParam.trim().toUpperCase();
  const supabase = createAdminClient();
  const { data } = await supabase.from("branches").select("code, name, active").eq("code", code).maybeSingle();

  if (!data) {
    return { resolvedBranch: null, branchNotice: "Kode cabang dari QR tidak ditemukan. Kamu tetap bisa daftar tanpa cabang." };
  }
  if (!data.active) {
    return { resolvedBranch: null, branchNotice: "Cabang dari QR ini sedang tidak aktif. Kamu tetap bisa daftar tanpa cabang." };
  }

  const token = await signBranchCode(data.code);
  return { resolvedBranch: { code: data.code, name: data.name, token }, branchNotice: null };
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const { branch } = await searchParams;
  const { resolvedBranch, branchNotice } = await resolveBranch(branch);

  return (
    <AuthShell
      title="Buat Akun"
      subtitle="Cepat dan mudah — langsung bisa mulai klaim reward."
      footer={
        <>
          Sudah punya akun?{" "}
          <Link href="/login" className="font-bold text-gold-500 underline underline-offset-2">
            Masuk di sini
          </Link>
        </>
      }
    >
      <RegisterForm resolvedBranch={resolvedBranch} branchNotice={branchNotice} />
    </AuthShell>
  );
}
