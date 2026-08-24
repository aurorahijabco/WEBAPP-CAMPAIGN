"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client. Uses the PUBLIC anon key only — RLS policies
 * (see supabase/migrations/0001_init.sql) enforce all access control.
 * NEVER import SUPABASE_SERVICE_ROLE_KEY here.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
