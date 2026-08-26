-- =============================================================================
-- Migration 0008: Gemini OCR support for receipt claims
--
-- Adds the columns needed to make a receipt un-reusable across claims and to
-- carry the OCR-extracted merchant/receipt-number alongside the existing
-- `ocr_raw` column (already reserved in 0001_init.sql for this purpose).
-- No new tables — this extends `bills` (existing) and `campaign_settings`
-- (existing key/value store) only.
-- =============================================================================

alter table public.bills
  add column if not exists photo_hash text,
  add column if not exists receipt_number text,
  add column if not exists merchant_name text;

comment on column public.bills.photo_hash is
  'SHA-256 of the uploaded receipt image bytes, computed server-side. Used to reject the exact same photo being submitted for a second claim.';
comment on column public.bills.receipt_number is
  'Receipt/invoice number read by OCR from the struk, when legible. Used with branch_id to reject the same physical receipt being claimed twice.';
comment on column public.bills.merchant_name is
  'Merchant/store name read by OCR from the struk, when legible.';

-- Same image bytes must never back two different bills.
create unique index if not exists bills_photo_hash_uq
  on public.bills (photo_hash)
  where photo_hash is not null;

-- Same physical receipt (by its printed number) must never be claimed twice
-- at the same branch. Scoped to branch_id rather than globally unique since
-- receipt numbers are assigned per-branch POS/register and can collide
-- across different branches.
create unique index if not exists bills_branch_receipt_number_uq
  on public.bills (branch_id, receipt_number)
  where receipt_number is not null;

-- Optional, disabled-by-default minimum purchase amount for a claim to be
-- accepted, enforced against the OCR-verified total (never the client-
-- submitted amount). 0 = no minimum enforced, preserving current behavior
-- until a real value is set (e.g. via the campaign_settings table directly).
insert into public.campaign_settings (key, value)
values ('min_claim_amount', '0'::jsonb)
on conflict (key) do nothing;
