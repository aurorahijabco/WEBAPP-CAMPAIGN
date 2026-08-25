-- =============================================================================
-- Migration 0006: allow deleting an agent profile even after they've
-- reviewed bills/content or redeemed vouchers. These columns are historical
-- references (nullable already) but had no ON DELETE action, so deleting a
-- profiles row referenced by them would fail with a foreign key violation —
-- meaning Super Admin's "Delete Agent" feature would silently error out for
-- any agent with redeem history. Switch to SET NULL: the audit row survives,
-- only the dangling reference is cleared.
-- =============================================================================

alter table public.bills
  drop constraint if exists bills_reviewed_by_fkey,
  add constraint bills_reviewed_by_fkey
    foreign key (reviewed_by) references public.profiles(id) on delete set null;

alter table public.content_submissions
  drop constraint if exists content_submissions_reviewed_by_fkey,
  add constraint content_submissions_reviewed_by_fkey
    foreign key (reviewed_by) references public.profiles(id) on delete set null;

alter table public.vouchers
  drop constraint if exists vouchers_redeemed_by_fkey,
  add constraint vouchers_redeemed_by_fkey
    foreign key (redeemed_by) references public.profiles(id) on delete set null;
