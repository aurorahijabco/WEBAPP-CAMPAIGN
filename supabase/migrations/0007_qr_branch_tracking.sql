-- =============================================================================
-- Migration 0007: QR branch tracking for customers.
--
-- 1. Drop the unused `qr_code` column from branches. QR codes now encode
--    `branches.code` directly via the URL format /?branch=BRANCH_CODE —
--    there's no separate opaque token to store. `code` becomes the sole
--    branch identifier used externally, so it's now NOT NULL (already
--    UNIQUE from 0001; all 10 existing rows already have a code).
-- 2. redeem_voucher(): add a second branch check alongside the existing
--    voucher.branch_id vs agent.branch_id check — the customer's own
--    registered branch (profiles.branch_id, set at registration from the
--    QR they scanned) must also match the redeeming agent's branch. Only
--    enforced when the customer has a registered branch at all, so
--    customers who registered before this feature (or via direct
--    /register with no QR) are unaffected.
-- =============================================================================

alter table public.branches
  drop column if exists qr_code;

alter table public.branches
  alter column code set not null;

drop function if exists public.redeem_voucher(uuid, text, text);

create or replace function public.redeem_voucher(
  p_agent_id uuid,
  p_code text,
  p_product_name text
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
  v_customer_branch uuid;
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

  select branch_id into v_customer_branch from public.profiles where id = v_voucher.customer_id;
  if v_customer_branch is not null and v_customer_branch <> v_agent_branch then
    raise exception 'CUSTOMER_BRANCH_MISMATCH: voucher can only be redeemed at the customer''s registered branch';
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
        redeemed_amount = v_voucher.value,
        redeemed_by = p_agent_id
    where id = v_voucher.id
    returning * into v_voucher;

  return v_voucher;
end;
$$;

revoke all on function public.redeem_voucher(uuid, text, text) from public, anon, authenticated;
