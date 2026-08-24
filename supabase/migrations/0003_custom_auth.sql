-- =============================================================================
-- Migration 0003: Replace Supabase Auth with custom username+password+session
-- auth. Supabase remains the database only.
--
-- Confirmed with the project owner before running: only 2 real accounts
-- existed (1 customer, 1 admin, 0 bills/claims) — their Supabase-Auth
-- passwords cannot be migrated (one-way hashed by a system we're removing),
-- so those 2 rows are deleted here and both accounts re-register.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Drop the Supabase-Auth-specific trigger before touching auth.users, and
--    clear existing accounts (see note above).
-- ---------------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

delete from auth.users; -- cascades to public.profiles (and transitively bills/claims/vouchers/notifications, all empty)

-- ---------------------------------------------------------------------------
-- 1. profiles: no longer FK'd to auth.users; gains its own id default and a
--    password_hash column. username is already unique/not-null and becomes
--    the sole login identifier — there was never an email column here.
-- ---------------------------------------------------------------------------
alter table public.profiles
  drop constraint if exists profiles_id_fkey;

alter table public.profiles
  alter column id set default gen_random_uuid();

alter table public.profiles
  add column if not exists password_hash text;

-- Table is empty at this point (see step 0), so NOT NULL is safe to apply
-- immediately rather than backfilling.
alter table public.profiles
  alter column password_hash set not null;

-- ---------------------------------------------------------------------------
-- 2. sessions table — replaces Supabase Auth's session/JWT mechanism.
--    Only the SHA-256 hash of the raw token is stored; the raw token lives
--    only in the client's HttpOnly cookie (see lib/auth/session.ts).
-- ---------------------------------------------------------------------------
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  user_agent text
);

create index if not exists idx_sessions_user on public.sessions(user_id);
create index if not exists idx_sessions_expires on public.sessions(expires_at);

alter table public.sessions enable row level security;
-- Intentionally no policies: this table is only ever touched by the
-- service-role client (lib/supabase/admin.ts), from server-only code that
-- has already validated the session itself. RLS stays enabled (never
-- disabled) so a stray anon/authenticated-role request is denied by default.

-- ---------------------------------------------------------------------------
-- 3. redeem_voucher(): previously used auth.uid()/is_agent() to identify the
--    acting agent. There is no Supabase-issued JWT anymore, so the calling
--    Server Action now passes the agent's id explicitly (already validated
--    against our own session table before this RPC is ever called).
-- ---------------------------------------------------------------------------
drop function if exists public.redeem_voucher(text, text, numeric);

create or replace function public.redeem_voucher(
  p_agent_id uuid,
  p_code text,
  p_product_name text,
  p_amount numeric
)
returns public.vouchers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_voucher public.vouchers;
  v_agent_role app_role;
  v_agent_branch uuid;
  v_phase text;
begin
  select role, branch_id into v_agent_role, v_agent_branch
    from public.profiles where id = p_agent_id;

  if v_agent_role is distinct from 'agent' then
    raise exception 'FORBIDDEN: only agents can redeem vouchers';
  end if;

  if v_agent_branch is null then
    raise exception 'AGENT_NO_BRANCH: agent account is not assigned to a branch';
  end if;

  select * into v_voucher from public.vouchers where code = p_code for update;
  if not found then
    raise exception 'VOUCHER_NOT_FOUND';
  end if;

  if v_voucher.branch_id <> v_agent_branch then
    raise exception 'BRANCH_MISMATCH: voucher can only be redeemed at %', v_voucher.branch_id;
  end if;

  v_phase := public.campaign_phase();
  if v_phase <> 'during' then
    raise exception 'OUTSIDE_REDEMPTION_PERIOD: current phase is %', v_phase;
  end if;

  if v_voucher.status = 'REDEEMED' then
    raise exception 'ALREADY_REDEEMED';
  end if;

  if v_voucher.status = 'EXPIRED' then
    raise exception 'VOUCHER_EXPIRED';
  end if;

  if v_voucher.status <> 'ACTIVE' then
    raise exception 'VOUCHER_NOT_ACTIVE: current status is %', v_voucher.status;
  end if;

  if p_product_name is null or length(trim(p_product_name)) = 0 then
    raise exception 'PRODUCT_REQUIRED: must select a Series Sarimbit item';
  end if;

  update public.vouchers
    set status = 'REDEEMED',
        redeemed_at = now(),
        redeemed_amount = p_amount,
        redeemed_by = p_agent_id
    where id = v_voucher.id
    returning * into v_voucher;

  return v_voucher;
end;
$$;

-- Only the service-role client calls this now (from app/agent/actions.ts,
-- after validating the session itself) — no anon/authenticated grant needed.
revoke all on function public.redeem_voucher(uuid, text, text, numeric) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Drop every RLS policy and helper function that depended on
--    auth.uid()/auth.role() — there is no Supabase-issued JWT to populate
--    them anymore, so they would silently evaluate to NULL/false forever.
--    RLS stays ENABLED on every table (never disabled); with no permissive
--    policy left, anon/authenticated requests are denied by default and all
--    real access goes through the service-role client, authorized by our
--    own session check in application code.
-- ---------------------------------------------------------------------------
drop policy if exists branches_select on public.branches;
drop policy if exists branches_admin_write on public.branches;

drop policy if exists profiles_select_self on public.profiles;
drop policy if exists profiles_update_self on public.profiles;
drop policy if exists profiles_insert_self on public.profiles;

drop policy if exists settings_admin_write on public.campaign_settings;
-- settings_select ("using (true)") is unrelated to auth.uid() and stays —
-- it's the public landing page's read of campaign_settings.

drop policy if exists bills_select on public.bills;
drop policy if exists bills_insert on public.bills;
drop policy if exists bills_update on public.bills;

drop policy if exists claims_select on public.claims;
drop policy if exists claims_insert on public.claims;
drop policy if exists claims_update on public.claims;

drop policy if exists content_select on public.content_submissions;
drop policy if exists content_insert on public.content_submissions;
drop policy if exists content_update on public.content_submissions;

drop policy if exists vouchers_select on public.vouchers;
drop policy if exists vouchers_update on public.vouchers;

drop policy if exists notifications_select on public.notifications;
drop policy if exists notifications_update on public.notifications;

drop function if exists public.current_role();
drop function if exists public.current_branch_id();
drop function if exists public.is_admin();
drop function if exists public.is_agent();

-- =============================================================================
-- End of migration. See supabase/migrations/0004_storage_custom_auth.sql for
-- the matching change to the `receipts` storage bucket's policies.
-- =============================================================================
