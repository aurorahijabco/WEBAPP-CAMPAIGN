"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/business/auditLog";
import { revalidatePath } from "next/cache";

export type ActionState = { error?: string; success?: string } | undefined;

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesi berakhir" };
  const supabase = createAdminClient();

  const name = String(formData.get("name") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();

  if (name.length < 3) return { error: "Nama minimal 3 karakter" };
  if (!/^\+?[0-9]{9,15}$/.test(whatsapp)) return { error: "Nomor WhatsApp tidak valid" };

  const { error } = await supabase.from("profiles").update({ name, whatsapp }).eq("id", user.id);

  await writeAuditLog({
    action: "profile_updated",
    status: error ? "failed" : "success",
    actor: { id: user.id, username: user.username, role: user.role },
    entityType: "profile",
    entityId: user.id,
    branchId: user.branchId,
    metadata: { error: error?.message },
  });

  if (error) return { error: "Gagal menyimpan: " + error.message };

  revalidatePath("/customer/profile");
  return { success: "Profil berhasil diperbarui." };
}
