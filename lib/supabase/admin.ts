import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * SERVICE ROLE client — bypasses RLS entirely. Use ONLY in trusted
 * server-only code paths that are already gated by an explicit role check
 * (e.g. admin Server Actions that first verify `profile.role === 'admin'`).
 *
 * `import "server-only"` guarantees a build error if this file is ever
 * imported from client code.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
