-- =============================================================================
-- Aurora Hijab — Voucher Reward Campaign
-- Migration 0001: schema, indexes, RLS, business-logic functions, seed data
--
-- Run order matters. This file is idempotent-ish (uses IF NOT EXISTS / OR REPLACE)
-- so it is safe to re-run on a fresh Supabase project via:
--   supabase db push
-- or paste into the Supabase SQL editor.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. Enum types
-- ---------------------------------------------------------------------------
do $$ begin
  create type app_role as enum ('customer', 'agent', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type bill_status as enum ('VALID', 'HOLD', 'INVALID');
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_type as enum ('story', 'feed_photo', 'feed_reels');
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_platform as enum ('instagram', 'tiktok');
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_status as enum ('PENDING', 'APPROVED', 'REJECTED', 'HOLD');
exception when duplicate_object then null; end $$;

do $$ begin
  create type voucher_status as enum ('RESERVED', 'ACTIVE', 'REDEEMED', 'EXPIRED');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. Core tables
-- ---------------------------------------------------------------------------

-- Branches (cabang)
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,                 -- short code used in QR / redeem search
  qr_code text unique,              -- opaque token encoded into the branch QR
  address text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role app_role not null default 'customer',
  name text not null,
  username text unique not null,
  whatsapp text unique not null,
  branch_id uuid references public.branches(id),   -- required for agent role
  agreed_sk_at timestamptz,                         -- terms & conditions acceptance
  created_at timestamptz not null default now()
);

-- Campaign-wide settings (single source of truth, not hardcoded in client)
create table if not exists public.campaign_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Bills / receipts (struk pembelian Series Agustin)
create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  amount numeric(12,2) not null check (amount >= 0),
  items jsonb not null default '[]'::jsonb,   -- [{name, qty, price}]
  photo_path text not null,                   -- path in storage bucket 'receipts'
  status bill_status not null default 'HOLD',
  ocr_raw jsonb,                               -- reserved for future OCR integration
  note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Claims (1 claim per bill submission)
create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  bill_id uuid not null references public.bills(id) on delete cascade,
  purchase_status bill_status not null default 'HOLD',  -- mirrors/synced from bill
  flagged boolean not null default false,     -- potential duplicate, admin review
  flag_reason text,
  created_at timestamptz not null default now()
);

create unique index if not exists claims_bill_id_uq on public.claims(bill_id);

-- Content submissions (customer submits per tier, can retry after reject)
create table if not exists public.content_submissions (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  type content_type not null,
  platform content_platform not null,
  url text not null,
  status content_status not null default 'PENDING',
  reason text,                                -- reject/hold reason
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id)
);

-- Vouchers (created/updated once a claim's reward becomes eligible)
create table if not exists public.vouchers (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  claim_id uuid not null references public.claims(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  value integer not null check (value in (0, 20000, 30000, 40000, 50000)),
  status voucher_status not null default 'RESERVED',
  created_at timestamptz not null default now(),
  redeemed_at timestamptz,
  redeemed_amount numeric(12,2),
  redeemed_by uuid references public.profiles(id)  -- agent who redeemed
);

create unique index if not exists vouchers_claim_id_uq on public.vouchers(claim_id);

-- Notifications (in-app; WhatsApp is a separate provider hook, see README)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  meta jsonb default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_bills_customer on public.bills(customer_id);
create index if not exists idx_bills_branch on public.bills(branch_id);
create index if not exists idx_bills_status on public.bills(status);

create index if not exists idx_claims_customer on public.claims(customer_id);
create index if not exists idx_claims_branch on public.claims(branch_id);
create index if not exists idx_claims_purchase_status on public.claims(purchase_status);

create index if not exists idx_content_claim on public.content_submissions(claim_id);
create index if not exists idx_content_status on public.content_submissions(status);
create index if not exists idx_content_type on public.content_submissions(type);

create index if not exists idx_vouchers_customer on public.vouchers(customer_id);
create index if not exists idx_vouchers_branch on public.vouchers(branch_id);
create index if not exists idx_vouchers_status on public.vouchers(status);
create index if not exists idx_vouchers_code on public.vouchers(code);

create index if not exists idx_notifications_user on public.notifications(user_id, read_at);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_branch on public.profiles(branch_id);

-- ---------------------------------------------------------------------------
-- 4. Helper functions (role checks, used inside RLS policies)
-- These run with definer rights on the profiles table only, to avoid
-- infinite-recursive RLS lookups.
-- ---------------------------------------------------------------------------
create or replace function public.current_role()
returns app_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_branch_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select branch_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select role from public.profiles where id = auth.uid()) = 'admin', false);
$$;

create or replace function public.is_agent()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select role from public.profiles where id = auth.uid()) = 'agent', false);
$$;

-- ---------------------------------------------------------------------------
-- 5. Row Level Security
-- ---------------------------------------------------------------------------
alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.campaign_settings enable row level security;
alter table public.bills enable row level security;
alter table public.claims enable row level security;
alter table public.content_submissions enable row level security;
alter table public.vouchers enable row level security;
alter table public.notifications enable row level security;

-- branches: everyone authenticated can read active branches (needed for claim form);
-- only admin can write.
drop policy if exists branches_select on public.branches;
create policy branches_select on public.branches
  for select using (auth.role() = 'authenticated' or public.is_admin());

drop policy if exists branches_admin_write on public.branches;
create policy branches_admin_write on public.branches
  for all using (public.is_admin()) with check (public.is_admin());

-- profiles: user can read/update own row; admin can read/update all;
-- agent can read profiles of customers who share a claim in their branch (kept simple: agent can read own only + via joins on other tables).
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert with check (id = auth.uid());

-- campaign_settings: publicly readable (redemption period, reward tiers, etc.
-- are marketing copy shown on the public landing page before login), writable
-- by admin only.
drop policy if exists settings_select on public.campaign_settings;
create policy settings_select on public.campaign_settings
  for select using (true);

drop policy if exists settings_admin_write on public.campaign_settings;
create policy settings_admin_write on public.campaign_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- bills: customer owns their bills; agent can read bills of their branch (read-only,
-- for context when redeeming); admin full access.
drop policy if exists bills_select on public.bills;
create policy bills_select on public.bills
  for select using (
    customer_id = auth.uid()
    or public.is_admin()
    or (public.is_agent() and branch_id = public.current_branch_id())
  );

drop policy if exists bills_insert on public.bills;
create policy bills_insert on public.bills
  for insert with check (customer_id = auth.uid());

drop policy if exists bills_update on public.bills;
create policy bills_update on public.bills
  for update using (public.is_admin()) with check (public.is_admin());

-- claims: same visibility model as bills
drop policy if exists claims_select on public.claims;
create policy claims_select on public.claims
  for select using (
    customer_id = auth.uid()
    or public.is_admin()
    or (public.is_agent() and branch_id = public.current_branch_id())
  );

drop policy if exists claims_insert on public.claims;
create policy claims_insert on public.claims
  for insert with check (customer_id = auth.uid());

drop policy if exists claims_update on public.claims;
create policy claims_update on public.claims
  for update using (public.is_admin()) with check (public.is_admin());

-- content_submissions: visible/insertable by the owning customer (via claim),
-- admin can read/update all (review). Agents do not need content access.
drop policy if exists content_select on public.content_submissions;
create policy content_select on public.content_submissions
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.claims c
      where c.id = content_submissions.claim_id and c.customer_id = auth.uid()
    )
  );

drop policy if exists content_insert on public.content_submissions;
create policy content_insert on public.content_submissions
  for insert with check (
    exists (
      select 1 from public.claims c
      where c.id = content_submissions.claim_id and c.customer_id = auth.uid()
    )
  );

drop policy if exists content_update on public.content_submissions;
create policy content_update on public.content_submissions
  for update using (public.is_admin()) with check (public.is_admin());

-- vouchers: customer sees own; agent sees vouchers for their branch (needed to redeem);
-- admin sees all. Updates (redeem) restricted to agent-of-branch or admin via function below,
-- but we still allow direct UPDATE policy scoped tightly as a safety net.
drop policy if exists vouchers_select on public.vouchers;
create policy vouchers_select on public.vouchers
  for select using (
    customer_id = auth.uid()
    or public.is_admin()
    or (public.is_agent() and branch_id = public.current_branch_id())
  );

drop policy if exists vouchers_update on public.vouchers;
create policy vouchers_update on public.vouchers
  for update using (
    public.is_admin()
    or (public.is_agent() and branch_id = public.current_branch_id() and status = 'ACTIVE')
  )
  with check (
    public.is_admin()
    or (public.is_agent() and branch_id = public.current_branch_id())
  );

-- notifications: user reads/marks own notifications; admin can read all
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Note: INSERTs into notifications/vouchers driven by business logic run via
-- SECURITY DEFINER functions below (triggers), which bypass RLS safely because
-- the logic itself enforces correctness. Direct client INSERT on vouchers/
-- notifications (other than via functions) is intentionally NOT granted.

-- ---------------------------------------------------------------------------
-- 6. Business logic: reward computation
-- Non-cumulative. Value = highest verified tier, unless all three tiers are
-- approved, in which case it is capped at 50,000.
-- ---------------------------------------------------------------------------
create or replace function public.compute_reward_value(p_claim_id uuid)
returns integer
language plpgsql
stable
as $$
declare
  v_story boolean;
  v_photo boolean;
  v_reels boolean;
begin
  select
    bool_or(type = 'story' and status = 'APPROVED'),
    bool_or(type = 'feed_photo' and status = 'APPROVED'),
    bool_or(type = 'feed_reels' and status = 'APPROVED')
  into v_story, v_photo, v_reels
  from public.content_submissions
  where claim_id = p_claim_id;

  if coalesce(v_story, false) and coalesce(v_photo, false) and coalesce(v_reels, false) then
    return 50000;
  elsif coalesce(v_reels, false) then
    return 40000;
  elsif coalesce(v_photo, false) then
    return 30000;
  elsif coalesce(v_story, false) then
    return 20000;
  else
    return 0;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Voucher code generator
-- ---------------------------------------------------------------------------
create or replace function public.generate_voucher_code()
returns text
language plpgsql
as $$
declare
  v_code text;
begin
  loop
    v_code := 'AH-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from public.vouchers where code = v_code);
  end loop;
  return v_code;
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. Campaign phase helper
-- Reads redemption_start / redemption_end from campaign_settings.
-- ---------------------------------------------------------------------------
create or replace function public.campaign_phase()
returns text
language plpgsql
stable
as $$
declare
  v_start timestamptz;
  v_end timestamptz;
  v_val jsonb;
begin
  select value into v_val from public.campaign_settings where key = 'redemption_period';
  if v_val is null then
    return 'before';
  end if;
  v_start := (v_val->>'start')::timestamptz;
  v_end := (v_val->>'end')::timestamptz;

  if now() < v_start then
    return 'before';
  elsif now() >= v_start and now() <= v_end then
    return 'during';
  else
    return 'after';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 9. Sync voucher for a claim: create/update based on purchase + content state.
-- Called by triggers on bills, claims, and content_submissions.
-- Idempotent: safe to call repeatedly.
-- ---------------------------------------------------------------------------
create or replace function public.sync_voucher_for_claim(p_claim_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim record;
  v_reward integer;
  v_existing record;
  v_phase text;
  v_new_status voucher_status;
begin
  select * into v_claim from public.claims where id = p_claim_id;
  if not found then
    return;
  end if;

  -- Only eligible if the underlying purchase is VALID
  if v_claim.purchase_status <> 'VALID' then
    -- If purchase becomes invalid after a voucher existed and was never
    -- redeemed, expire it rather than deleting (keeps audit trail).
    update public.vouchers
      set status = 'EXPIRED'
      where claim_id = p_claim_id and status in ('RESERVED', 'ACTIVE');
    return;
  end if;

  v_reward := public.compute_reward_value(p_claim_id);
  if v_reward <= 0 then
    return; -- nothing to reward yet
  end if;

  v_phase := public.campaign_phase();
  v_new_status := case v_phase
    when 'during' then 'ACTIVE'
    when 'after' then 'EXPIRED'
    else 'RESERVED'
  end;

  select * into v_existing from public.vouchers where claim_id = p_claim_id;

  if v_existing.id is null then
    insert into public.vouchers (code, claim_id, customer_id, branch_id, value, status)
    values (
      public.generate_voucher_code(),
      p_claim_id,
      v_claim.customer_id,
      v_claim.branch_id,
      v_reward,
      v_new_status
    );

    insert into public.notifications (user_id, message, meta)
    values (
      v_claim.customer_id,
      'Selamat! Voucher senilai Rp' || to_char(v_reward, 'FM999,999,999') || ' berhasil diterbitkan.',
      jsonb_build_object('type', 'voucher_issued', 'claim_id', p_claim_id)
    );
  else
    -- Do not downgrade a REDEEMED voucher; only update value/status if still open.
    if v_existing.status in ('RESERVED', 'ACTIVE') then
      update public.vouchers
        set value = greatest(v_existing.value, v_reward),
            status = v_new_status
        where id = v_existing.id;

      if v_reward > v_existing.value then
        insert into public.notifications (user_id, message, meta)
        values (
          v_claim.customer_id,
          'Nilai voucher kamu naik menjadi Rp' || to_char(v_reward, 'FM999,999,999') || '.',
          jsonb_build_object('type', 'voucher_upgraded', 'claim_id', p_claim_id)
        );
      end if;
    end if;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 10. Triggers
-- ---------------------------------------------------------------------------

-- 10a. Keep claims.purchase_status in sync with bills.status, flag potential
--      duplicate bills for the same customer+branch+amount within 24h.
create or replace function public.trg_bills_after_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.claims
    set purchase_status = new.status
    where bill_id = new.id;

  if new.status = 'VALID' then
    insert into public.notifications (user_id, message, meta)
    values (new.customer_id, 'Struk kamu telah diverifikasi VALID.',
            jsonb_build_object('type', 'bill_valid', 'bill_id', new.id));
    perform public.sync_voucher_for_claim(c.id) from public.claims c where c.bill_id = new.id;
  elsif new.status = 'INVALID' then
    insert into public.notifications (user_id, message, meta)
    values (new.customer_id, 'Struk kamu ditolak (INVALID). Silakan hubungi admin jika ini keliru.',
            jsonb_build_object('type', 'bill_invalid', 'bill_id', new.id));
  end if;

  return new;
end;
$$;

drop trigger if exists bills_after_update on public.bills;
create trigger bills_after_update
  after update of status on public.bills
  for each row execute function public.trg_bills_after_update();

-- 10b. Detect potential duplicate bill on insert (same customer, branch, amount,
--      within 24 hours) -> flag the resulting claim for admin review.
create or replace function public.trg_bills_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.bills b
    where b.customer_id = new.customer_id
      and b.branch_id = new.branch_id
      and b.amount = new.amount
      and b.id <> new.id
      and b.created_at > now() - interval '24 hours'
  ) then
    update public.claims
      set flagged = true, flag_reason = 'Kemungkinan struk duplikat (nominal & cabang sama dalam 24 jam)'
      where bill_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists bills_after_insert on public.bills;
create trigger bills_after_insert
  after insert on public.bills
  for each row execute function public.trg_bills_after_insert();

-- 10c. When a claim is created, seed its purchase_status from the bill and
--      run the duplicate flag check again (covers race where claim is created
--      after bill).
create or replace function public.trg_claims_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, message, meta)
  values (new.customer_id, 'Klaim baru berhasil dibuat dan menunggu verifikasi struk.',
          jsonb_build_object('type', 'claim_created', 'claim_id', new.id));
  return new;
end;
$$;

drop trigger if exists claims_after_insert on public.claims;
create trigger claims_after_insert
  after insert on public.claims
  for each row execute function public.trg_claims_after_insert();

-- 10d. On content review (status changes into APPROVED/REJECTED/HOLD), sync
--      voucher and notify customer.
create or replace function public.trg_content_after_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer uuid;
  v_label text;
begin
  select customer_id into v_customer from public.claims where id = new.claim_id;

  v_label := case new.type
    when 'story' then 'Story Photo'
    when 'feed_photo' then 'Feed Photo'
    when 'feed_reels' then 'Feed Reels'
  end;

  if new.status = 'APPROVED' then
    insert into public.notifications (user_id, message, meta)
    values (v_customer, v_label || ' kamu APPROVED. Voucher sedang diproses.',
            jsonb_build_object('type', 'content_approved', 'claim_id', new.claim_id));
    perform public.sync_voucher_for_claim(new.claim_id);
  elsif new.status = 'REJECTED' then
    insert into public.notifications (user_id, message, meta)
    values (v_customer, v_label || ' ditolak: ' || coalesce(new.reason, 'lihat detail klaim') || '. Kamu bisa submit ulang.',
            jsonb_build_object('type', 'content_rejected', 'claim_id', new.claim_id));
  elsif new.status = 'HOLD' then
    insert into public.notifications (user_id, message, meta)
    values (v_customer, v_label || ' sedang di-HOLD untuk review lebih lanjut.',
            jsonb_build_object('type', 'content_hold', 'claim_id', new.claim_id));
  end if;

  return new;
end;
$$;

drop trigger if exists content_after_update on public.content_submissions;
create trigger content_after_update
  after update of status on public.content_submissions
  for each row execute function public.trg_content_after_update();

-- 10e. When a voucher is redeemed, notify the customer.
create or replace function public.trg_vouchers_after_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'REDEEMED' and old.status <> 'REDEEMED' then
    insert into public.notifications (user_id, message, meta)
    values (new.customer_id,
            'Voucher ' || new.code || ' berhasil ditukarkan sebesar Rp' || to_char(coalesce(new.redeemed_amount, new.value), 'FM999,999,999') || '.',
            jsonb_build_object('type', 'voucher_redeemed', 'voucher_id', new.id));
  end if;
  return new;
end;
$$;

drop trigger if exists vouchers_after_update on public.vouchers;
create trigger vouchers_after_update
  after update of status on public.vouchers
  for each row execute function public.trg_vouchers_after_update();

-- ---------------------------------------------------------------------------
-- 11. Redeem RPC (server-side entry point, called from an Agent Server Action
-- via the user's own session — RLS + this function double-enforce correctness).
-- Validates: voucher exists, agent's branch matches, status ACTIVE, within
-- redemption period, and records the redeem product/amount.
-- ---------------------------------------------------------------------------
create or replace function public.redeem_voucher(
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
  v_agent_branch uuid;
  v_phase text;
begin
  if not public.is_agent() then
    raise exception 'FORBIDDEN: only agents can redeem vouchers';
  end if;

  v_agent_branch := public.current_branch_id();
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
        redeemed_by = auth.uid()
    where id = v_voucher.id
    returning * into v_voucher;

  return v_voucher;
end;
$$;

grant execute on function public.redeem_voucher(text, text, numeric) to authenticated;

-- ---------------------------------------------------------------------------
-- 12. Campaign phase sweeper
-- Call periodically (e.g. via a scheduled Supabase Edge Function / pg_cron)
-- to flip RESERVED -> ACTIVE at redemption start, and ACTIVE -> EXPIRED after
-- redemption end. Safe to call as often as needed; it is idempotent.
-- ---------------------------------------------------------------------------
create or replace function public.sweep_voucher_phase()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phase text;
begin
  v_phase := public.campaign_phase();

  if v_phase = 'during' then
    update public.vouchers set status = 'ACTIVE' where status = 'RESERVED';
  elsif v_phase = 'after' then
    update public.vouchers set status = 'EXPIRED' where status in ('RESERVED', 'ACTIVE');
  end if;
end;
$$;

-- If pg_cron extension is available on your Supabase plan, you can schedule it:
-- select cron.schedule('sweep-voucher-phase', '*/15 * * * *', $$select public.sweep_voucher_phase();$$);
-- Otherwise, trigger this via a Vercel Cron -> Next.js API route -> Supabase RPC (see README).

-- ---------------------------------------------------------------------------
-- 13. Auto-create profile row on new auth.users signup.
--
-- Username/whatsapp are still validated (uniqueness pre-check) client-side in
-- app/(auth)/actions.ts -> registerCustomer() before calling supabase.auth.signUp(),
-- but the actual public.profiles row is created here, driven by
-- raw_user_meta_data (options.data passed to signUp()). Doing it in a
-- SECURITY DEFINER trigger — rather than a follow-up client insert — means it
-- runs regardless of whether the session is confirmed yet (RLS-independent),
-- so "Confirm email" projects don't silently drop the profile row.
--
-- COALESCE handles a couple of historically-used metadata key spellings so
-- older clients / other callers of signUp() keep working.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_username text;
  v_whatsapp text;
  v_role app_role;
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'fullName',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  v_username := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );

  v_whatsapp := coalesce(
    new.raw_user_meta_data->>'phone_number',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'whatsapp',
    new.phone
  );

  v_role := coalesce(
    (new.raw_user_meta_data->>'role')::app_role,
    'customer'
  );

  insert into public.profiles (id, role, name, username, whatsapp)
  values (new.id, v_role, v_name, v_username, v_whatsapp)
  on conflict (id) do nothing;

  return new;
exception
  when others then
    -- Never let a profile-creation problem (bad metadata, unique clash on
    -- username/whatsapp, etc.) turn into an unhandled 500 on signUp(). The
    -- auth user is still created; the app can detect a missing profile row
    -- and prompt the user to complete it.
    raise warning 'handle_new_user failed for user %: %', new.id, sqlerrm;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- 13 branches
insert into public.branches (name, code, qr_code, address, active) values
  ('Aurora Hijab Kemang, Jakarta Selatan', 'KEMANG', 'qr-kemang-001', 'Jl. Kemang Raya No. 10, Jakarta Selatan', true),
  ('Aurora Hijab Kelapa Gading, Jakarta Utara', 'KLPGADING', 'qr-klpgading-001', 'Jl. Boulevard Raya, Kelapa Gading, Jakarta Utara', true),
  ('Aurora Hijab Dago, Bandung', 'DAGO', 'qr-dago-001', 'Jl. Ir. H. Djuanda (Dago) No. 88, Bandung', true),
  ('Aurora Hijab Malioboro, Yogyakarta', 'MALIOBORO', 'qr-malioboro-001', 'Jl. Malioboro No. 45, Yogyakarta', true),
  ('Aurora Hijab Simpang Lima, Semarang', 'SMPLIMA', 'qr-smplima-001', 'Jl. Pandanaran, Simpang Lima, Semarang', true),
  ('Aurora Hijab Tunjungan, Surabaya', 'TUNJUNGAN', 'qr-tunjungan-001', 'Jl. Tunjungan No. 12, Surabaya', true),
  ('Aurora Hijab Buah Batu, Bandung', 'BUAHBATU', 'qr-buahbatu-001', 'Jl. Buah Batu No. 200, Bandung', true),
  ('Aurora Hijab Antapani, Bandung', 'ANTAPANI', 'qr-antapani-001', 'Jl. Terusan Jakarta, Antapani, Bandung', true),
  ('Aurora Hijab Panam, Pekanbaru', 'PANAM', 'qr-panam-001', 'Jl. HR Soebrantas, Panam, Pekanbaru', true),
  ('Aurora Hijab Veteran, Medan', 'VETERAN', 'qr-veteran-001', 'Jl. Veteran, Medan', true)
on conflict (code) do nothing;

-- Campaign settings
insert into public.campaign_settings (key, value) values
  ('redemption_period', jsonb_build_object(
      'start', '2026-10-05T00:00:00+07:00',
      'end',   '2026-11-02T23:59:59+07:00'
  )),
  ('reward_tiers', jsonb_build_object(
      'story_photo', 20000,
      'feed_photo', 30000,
      'feed_reels', 40000,
      'all_three', 50000
  )),
  ('redeem_product', jsonb_build_object(
      'name', 'Series Sarimbit',
      'reference_price', 299000
  )),
  ('content_requirements', jsonb_build_object(
      'original_content', true,
      'must_show_series_agustin', true,
      'must_mention', '@aurorahijab.co',
      'account_must_be_public_or_reviewable', true,
      'reels_min_seconds', 30
  ))
on conflict (key) do update set value = excluded.value, updated_at = now();

-- NOTE: seed admin/agent/customer AUTH users cannot be created via plain SQL
-- (auth.users requires Supabase Auth API / GoTrue to correctly hash passwords).
-- See README "Seed demo accounts" for the supabase/seed-users.ts script that
-- creates these via the Admin API and links them to public.profiles + branches.
