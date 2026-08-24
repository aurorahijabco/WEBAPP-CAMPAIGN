"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { registerSchema, loginSchema } from "@/lib/business/validation";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import type { AppRole } from "@/types/domain";

export type ActionState = { error?: string } | undefined;

export async function registerCustomer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = {
    name: formData.get("name"),
    username: formData.get("username"),
    whatsapp: formData.get("whatsapp"),
    password: formData.get("password"),
    agreedSk: formData.get("agreedSk") === "on",
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const { name, username, whatsapp, password } = parsed.data;

  const supabase = createAdminClient();

  const { data: existingUsername } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (existingUsername) return { error: "Username sudah digunakan" };

  const { data: existingWhatsapp } = await supabase
    .from("profiles")
    .select("id")
    .eq("whatsapp", whatsapp)
    .maybeSingle();
  if (existingWhatsapp) return { error: "Nomor WhatsApp sudah terdaftar" };

  const passwordHash = await hashPassword(password);

  const { data: profile, error: insertError } = await supabase
    .from("profiles")
    .insert({
      role: "customer",
      name,
      username,
      whatsapp,
      password_hash: passwordHash,
      agreed_sk_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError || !profile) {
    return { error: "Gagal membuat akun: " + (insertError?.message ?? "unknown error") };
  }

  await createSession(profile.id);
  redirect("/customer/dashboard");
}

async function loginAs(
  formData: FormData,
  expectedRole: AppRole,
  fallbackHome: string
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Username dan password wajib diisi" };
  const { username, password } = parsed.data;

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, password_hash")
    .eq("username", username)
    .maybeSingle();

  if (!profile) return { error: "Username atau password salah" };

  const valid = await verifyPassword(password, profile.password_hash);
  if (!valid) return { error: "Username atau password salah" };

  if (profile.role !== expectedRole) {
    return { error: `Akun ini bukan akun ${expectedRole}. Gunakan halaman login yang sesuai.` };
  }

  await createSession(profile.id);
  redirect(fallbackHome);
}

export async function loginCustomer(_prev: ActionState, formData: FormData) {
  return loginAs(formData, "customer", "/customer/dashboard");
}

export async function loginAgent(_prev: ActionState, formData: FormData) {
  return loginAs(formData, "agent", "/agent/dashboard");
}

export async function loginAdmin(_prev: ActionState, formData: FormData) {
  return loginAs(formData, "admin", "/admin");
}
