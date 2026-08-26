"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { createAgentSchema, updateAgentSchema, deleteAgentSchema } from "@/lib/business/validation";
import { writeAuditLog } from "@/lib/business/auditLog";
import { revalidatePath } from "next/cache";

export type ActionState = { error?: string; success?: string } | undefined;

async function assertAdmin() {
  const user = await getCurrentUser();
  const supabase = createAdminClient();
  return { supabase, user, ok: user?.role === "admin" };
}

async function logUnauthorized(user: Awaited<ReturnType<typeof getCurrentUser>>, attemptedAction: string) {
  await writeAuditLog({
    action: "unauthorized_access",
    status: "failed",
    actor: user ? { id: user.id, username: user.username, role: user.role } : null,
    entityType: "route",
    metadata: { attemptedAction },
  });
}

/**
 * Only a Super Admin can reach this — enforced here (not just in the UI),
 * and the created row's role is hardcoded to "agent" so there is no way for
 * this form to be used to create another admin.
 */
export async function createAgent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user, ok } = await assertAdmin();
  if (!ok) {
    await logUnauthorized(user, "createAgent");
    return { error: "Tidak diizinkan" };
  }

  const parsed = createAgentSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    whatsapp: formData.get("whatsapp"),
    password: formData.get("password"),
    branchId: formData.get("branchId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  const { name, username, whatsapp, password, branchId } = parsed.data;

  const { data: existing } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
  if (existing) return { error: "Username sudah digunakan" };

  const passwordHash = await hashPassword(password);
  const { data: created, error } = await supabase
    .from("profiles")
    .insert({
      role: "agent",
      name,
      username,
      whatsapp,
      branch_id: branchId,
      password_hash: passwordHash,
    })
    .select("id")
    .single();

  await writeAuditLog({
    action: "agent_created",
    status: error ? "failed" : "success",
    actor: { id: user!.id, username: user!.username, role: user!.role },
    entityType: "profile",
    entityId: created?.id,
    branchId,
    metadata: { targetUsername: username, error: error?.message },
  });

  if (error) return { error: "Gagal menambahkan agent: " + error.message };

  revalidatePath("/admin/agents");
  return { success: "Agent baru berhasil ditambahkan." };
}

export async function updateAgent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user, ok } = await assertAdmin();
  if (!ok) {
    await logUnauthorized(user, "updateAgent");
    return { error: "Tidak diizinkan" };
  }

  const parsed = updateAgentSchema.safeParse({
    agentId: formData.get("agentId"),
    name: formData.get("name"),
    whatsapp: formData.get("whatsapp"),
    branchId: formData.get("branchId"),
    password: formData.get("password") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  const { agentId, name, whatsapp, branchId, password } = parsed.data;

  // Defense in depth against role tampering: only ever touches rows that are
  // already role='agent', so this can never be used to edit an admin.
  const { data: target } = await supabase.from("profiles").select("role").eq("id", agentId).maybeSingle();
  if (!target || target.role !== "agent") return { error: "Agent tidak ditemukan" };

  const update: Record<string, unknown> = { name, whatsapp, branch_id: branchId };
  if (password) update.password_hash = await hashPassword(password);

  const { error } = await supabase.from("profiles").update(update).eq("id", agentId).eq("role", "agent");

  await writeAuditLog({
    action: "agent_updated",
    status: error ? "failed" : "success",
    actor: { id: user!.id, username: user!.username, role: user!.role },
    entityType: "profile",
    entityId: agentId,
    branchId,
    metadata: { passwordChanged: Boolean(password), error: error?.message },
  });

  if (error) return { error: "Gagal memperbarui agent: " + error.message };

  revalidatePath("/admin/agents");
  return { success: "Data agent berhasil diperbarui." };
}

export async function deleteAgent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user, ok } = await assertAdmin();
  if (!ok) {
    await logUnauthorized(user, "deleteAgent");
    return { error: "Tidak diizinkan" };
  }

  const parsed = deleteAgentSchema.safeParse({ agentId: formData.get("agentId") });
  if (!parsed.success) return { error: "Data tidak valid" };

  const { data: target } = await supabase.from("profiles").select("role, username, branch_id").eq("id", parsed.data.agentId).maybeSingle();
  if (!target || target.role !== "agent") return { error: "Agent tidak ditemukan" };

  const { error } = await supabase.from("profiles").delete().eq("id", parsed.data.agentId).eq("role", "agent");

  await writeAuditLog({
    action: "agent_deleted",
    status: error ? "failed" : "success",
    actor: { id: user!.id, username: user!.username, role: user!.role },
    entityType: "profile",
    entityId: parsed.data.agentId,
    branchId: target.branch_id,
    metadata: { targetUsername: target.username, error: error?.message },
  });

  if (error) return { error: "Gagal menghapus agent: " + error.message };

  revalidatePath("/admin/agents");
  return { success: "Agent berhasil dihapus." };
}
