-- =============================================================================
-- Migration 0002: Storage bucket for receipt photos
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- Path convention enforced by the app: receipts/{customer_id}/{bill_id}.{ext}
-- so owner-check = split the path's first folder segment against auth.uid().

drop policy if exists receipts_owner_insert on storage.objects;
create policy receipts_owner_insert on storage.objects
  for insert
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists receipts_owner_select on storage.objects;
create policy receipts_owner_select on storage.objects
  for select
  using (
    bucket_id = 'receipts'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
      or (
        public.is_agent()
        and exists (
          select 1 from public.bills b
          where b.photo_path = storage.objects.name
            and b.branch_id = public.current_branch_id()
        )
      )
    )
  );

-- No public update/delete policies: receipts are immutable once uploaded.
-- Admin can manage via service-role client (bypasses RLS) if ever needed.
