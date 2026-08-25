-- =============================================================================
-- Migration 0005: redeem_voucher() must use the voucher's own `value` for
-- redeemed_amount, not an agent-supplied amount. Previously the Server Action
-- passed whatever number was in the RedeemForm's "Nominal Redeem" input
-- straight through to this function as p_amount, meaning an agent could type
-- an arbitrary redemption value. Nominal must only ever come from the
-- voucher row itself, and only after the code has been validated.
-- =============================================================================

drop function if exists public.redeem_voucher(uuid, text, text, numeric);

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

  -- redeemed_amount always comes from the voucher's own value, never from
  -- caller input, so an agent can never redeem for an arbitrary amount.
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
