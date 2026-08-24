-- =============================================================================
-- Migration 0004: Tighten `receipts` storage policies for custom auth
--
-- These policies relied on auth.uid()/is_admin()/is_agent(), which no
-- longer resolve to anything meaningful without Supabase Auth. Receipt
-- upload (app/customer/actions.ts) and signed-URL generation for admin
-- review (app/admin/receipts/page.tsx) now both go through the service-role
-- client from server-only code that has already validated the caller via
-- our own session — so storage.objects RLS stays enabled with no
-- permissive policy left (default-deny for anon/authenticated).
-- =============================================================================

drop policy if exists receipts_owner_insert on storage.objects;
drop policy if exists receipts_owner_select on storage.objects;
