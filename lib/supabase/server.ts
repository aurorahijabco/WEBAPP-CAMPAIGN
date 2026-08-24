import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. Runs as the logged-in user (anon key + user's cookies),
 * so RLS applies. Use this for almost everything.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },setAll(
  cookiesToSet: {
    name: string;
    value: string;
    options?: {
      domain?: string;
      encode?: (value: string) => string;
      expires?: Date;
      httpOnly?: boolean;
      maxAge?: number;
      path?: string;
      sameSite?: boolean | "lax" | "strict" | "none";
      secure?: boolean;
    };
  }[]
) {
  try {
    cookiesToSet.forEach(({ name, value, options }) =>
      cookieStore.set(name, value, options)
    );
  } catch {
    // The `setAll` method was called from a Server Component.
    // This can be ignored if middleware refreshes the session.
  }
},
      },
    }
  );
}
