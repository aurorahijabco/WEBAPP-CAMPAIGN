import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * PUBLIC anon-key client — no session, no auth. Use this only for data that
 * is meant to be readable by anyone before login (e.g. the landing page's
 * `campaign_settings` read). Every authenticated read/write goes through
 * `lib/supabase/admin.ts`'s service-role client instead, gated by our own
 * custom session check (`lib/auth/session.ts`) — this project does not use
 * Supabase Auth, so there is no per-user RLS session to build here.
 */
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
