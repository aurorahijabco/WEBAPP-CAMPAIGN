import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AppRole } from "@/types/domain";

// Server-only audit trail writer. Called from Server Actions after (or
// instead of, on failure) the actual business logic — never from the
// client, and never trusted to a client-supplied value beyond what the
// caller explicitly passes in `actor`/`metadata`.
//
// Every known activity this campaign needs to trace is named here so
// callers can't invent ad-hoc strings that don't match the filter UI.
export type AuditAction =
  | "register"
  | "login"
  | "login_failed"
  | "logout"
  | "claim_created"
  | "receipt_uploaded"
  | "ocr_success"
  | "ocr_failed"
  | "claim_valid"
  | "claim_invalid"
  | "content_submitted"
  | "content_reviewed"
  | "bill_reviewed"
  | "voucher_redeemed"
  | "voucher_redeem_failed"
  | "profile_updated"
  | "agent_created"
  | "agent_updated"
  | "agent_deleted"
  | "branch_created"
  | "branch_updated"
  | "branch_deleted"
  | "branch_status_changed"
  | "unauthorized_access";

export type AuditEntityType =
  | "profile"
  | "session"
  | "claim"
  | "bill"
  | "content_submission"
  | "voucher"
  | "branch"
  | "route";

export type AuditActor = {
  id?: string | null;
  username?: string | null;
  role?: AppRole | null;
};

export type AuditLogInput = {
  action: AuditAction;
  status: "success" | "failed";
  actor?: AuditActor | null;
  entityType?: AuditEntityType;
  entityId?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  metadata?: Record<string, unknown>;
};

export const AUDIT_ACTIONS: AuditAction[] = [
  "register",
  "login",
  "login_failed",
  "logout",
  "claim_created",
  "receipt_uploaded",
  "ocr_success",
  "ocr_failed",
  "claim_valid",
  "claim_invalid",
  "content_submitted",
  "content_reviewed",
  "bill_reviewed",
  "voucher_redeemed",
  "voucher_redeem_failed",
  "profile_updated",
  "agent_created",
  "agent_updated",
  "agent_deleted",
  "branch_created",
  "branch_updated",
  "branch_deleted",
  "branch_status_changed",
  "unauthorized_access",
];

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  register: "Registrasi",
  login: "Login",
  login_failed: "Login Gagal",
  logout: "Logout",
  claim_created: "Klaim Dibuat",
  receipt_uploaded: "Upload Struk",
  ocr_success: "OCR Berhasil",
  ocr_failed: "OCR Gagal",
  claim_valid: "Klaim Valid",
  claim_invalid: "Klaim Tidak Valid",
  content_submitted: "Konten Disubmit",
  content_reviewed: "Konten Direview",
  bill_reviewed: "Struk Direview",
  voucher_redeemed: "Voucher Diredeem",
  voucher_redeem_failed: "Redeem Voucher Gagal",
  profile_updated: "Profil Diubah",
  agent_created: "Agent Ditambahkan",
  agent_updated: "Agent Diubah",
  agent_deleted: "Agent Dihapus",
  branch_created: "Cabang Ditambahkan",
  branch_updated: "Cabang Diubah",
  branch_deleted: "Cabang Dihapus",
  branch_status_changed: "Status Cabang Diubah",
  unauthorized_access: "Akses Tidak Sah",
};

// Defense in depth: even if a caller accidentally spreads a wider object
// into `metadata`, these keys are stripped before the row is ever written.
const FORBIDDEN_METADATA_KEYS = new Set([
  "password",
  "password_hash",
  "passwordHash",
  "token",
  "token_hash",
  "tokenHash",
  "session_token",
  "api_key",
  "apiKey",
  "gemini_api_key",
  "GEMINI_API_KEY",
]);

function sanitizeMetadata(metadata: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!metadata) return {};
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (FORBIDDEN_METADATA_KEYS.has(key)) continue;
    clean[key] = value;
  }
  return clean;
}

/**
 * Writes one audit_logs row. Never throws — a logging failure must never
 * break the user-facing flow it's observing, so any DB error here is only
 * logged to the server console.
 */
export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("audit_logs").insert({
      user_id: input.actor?.id ?? null,
      username: input.actor?.username ?? null,
      role: input.actor?.role ?? null,
      action: input.action,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      branch_id: input.branchId ?? null,
      branch_name: input.branchName ?? null,
      status: input.status,
      metadata: sanitizeMetadata(input.metadata),
    });
    if (error) console.error("[audit] insert failed:", error.message);
  } catch (err) {
    console.error("[audit] unexpected error:", err);
  }
}
