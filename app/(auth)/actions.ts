"use server";

import { createClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/business/validation";
import { redirect } from "next/navigation";

export type ActionState = { error?: string; notice?: string } | undefined;

export async function registerCustomer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = {
    name: formData.get("name"),
    username: formData.get("username"),
    whatsapp: formData.get("whatsapp"),
    email: formData.get("email"),
    password: formData.get("password"),
    agreedSk: formData.get("agreedSk") === "on",
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const { name, username, whatsapp, email, password } = parsed.data;

  const supabase = await createClient();

  // Uniqueness pre-check (also enforced by DB unique constraints as source of truth)
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://webapp-campaign.vercel.app";

  // options.data becomes auth.users.raw_user_meta_data, which the
  // public.handle_new_user() trigger (supabase/migrations/0001_init.sql)
  // reads to create the matching public.profiles row. Keys must match what
  // that trigger looks for.
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        phone_number: whatsapp,
        username,
        role: "customer",
      },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (signUpError) {
    return { error: signUpError.message || "Gagal membuat akun, silakan coba lagi" };
  }
  if (!signUpData.user) {
    return { error: "Gagal membuat akun, silakan coba lagi" };
  }

  // Email confirmation required: no session yet, nothing to redirect into.
  if (!signUpData.session) {
    return {
      notice: "Akun berhasil dibuat. Silakan cek email kamu untuk konfirmasi sebelum login.",
    };
  }

  // Record terms acceptance now that we have an authenticated session; the
  // profile row itself was already created by the on_auth_user_created
  // trigger, so this is a best-effort update, not a signup blocker.
  await supabase
    .from("profiles")
    .update({ agreed_sk_at: new Date().toISOString() })
    .eq("id", signUpData.user.id);

  redirect("/customer/dashboard");
}

async function loginAs(
  formData: FormData,
  expectedRole: "customer" | "agent" | "admin",
  fallbackHome: string
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Email dan password wajib diisi" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email atau password salah" };
  if (!data.user) return { error: "Login gagal" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (!profile || profile.role !== expectedRole) {
    await supabase.auth.signOut();
    return { error: `Akun ini bukan akun ${expectedRole}. Gunakan halaman login yang sesuai.` };
  }

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
