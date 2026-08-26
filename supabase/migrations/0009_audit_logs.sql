-- =============================================================================
-- Migration 0009: Centralized audit log for Super Admin.
--
-- Records important activity across Customer, Agent, and Admin accounts —
-- auth events, claim/OCR outcomes, content/voucher lifecycle, and every
-- admin write on agents/branches — so a Super Admin has a single, tamper-
-- resistant trail. Written ONLY from server-side code (Server Actions),
-- never from the browser.
--
-- Access model mirrors `sessions` (see 0003_custom_auth.sql): RLS is
-- ENABLED with NO policies at all, so anon/authenticated Supabase API keys
-- are denied by default — there is no INSERT/UPDATE/DELETE policy for
-- anyone, and no SELECT policy for anyone. The only way to read or write
-- this table is the service-role client from trusted server code, which
-- itself checks `profile.role === 'admin'` before ever running a SELECT
-- against it (see lib/business/auditLog.ts / app/admin/audit-log). This
-- means Customers and Agents can never read, modify, or delete audit
-- entries, even if their own request goes through the same DB connection.
-- =============================================================================

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Actor snapshot. Denormalized (not just a FK) so a log entry still reads
  -- correctly after the account is edited/deleted, and so failed-login
  -- attempts (no matching profile) can still be recorded with whatever
  -- username was typed.
  user_id uuid references public.profiles(id) on delete set null,
  username text,
  role text,

  action text not null,
  entity_type text,
  entity_id text,

  branch_id uuid references public.branches(id) on delete set null,
  branch_name text,

  status text not null check (status in ('success', 'failed')),

  -- Free-form structured context (e.g. OCR quality flags, validation
  -- reasons, changed fields). NEVER populate with password_hash, session
  -- tokens, API keys, or other secrets — enforced by convention in
  -- lib/business/auditLog.ts, not by the DB.
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);
create index if not exists idx_audit_logs_user on public.audit_logs(user_id);
create index if not exists idx_audit_logs_username on public.audit_logs(username);
create index if not exists idx_audit_logs_role on public.audit_logs(role);
create index if not exists idx_audit_logs_action on public.audit_logs(action);
create index if not exists idx_audit_logs_status on public.audit_logs(status);
create index if not exists idx_audit_logs_branch on public.audit_logs(branch_id);

alter table public.audit_logs enable row level security;
-- Intentionally no policies — see header comment. Do not add a SELECT/write
-- policy here; admin-only read access is enforced in application code.
