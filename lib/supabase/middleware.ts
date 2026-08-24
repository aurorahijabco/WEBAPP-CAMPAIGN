import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = {
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
};

/**
 * Refreshes the Supabase auth session on every request and applies
 * role-based route protection for /customer, /agent, /admin.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Match "/admin" and "/admin/…" but not "/admin-login" (same for
  // agent/customer) — a naive startsWith() here previously caused
  // /agent-login and /admin-login to be treated as protected routes,
  // redirecting an unauthenticated visitor back to themselves in an
  // infinite loop and making it impossible to ever log in as agent/admin.
  const protectedPrefixes = ["/customer", "/agent", "/admin"];
  const isProtected = protectedPrefixes.some((p) => path === p || path.startsWith(`${p}/`));

  if (isProtected && !user) {
    const redirectTo = path.startsWith("/agent")
      ? "/agent-login"
      : path.startsWith("/admin")
        ? "/admin-login"
        : "/login";

    const url = request.nextUrl.clone();
    url.pathname = redirectTo;
    url.searchParams.set("next", path);

    return NextResponse.redirect(url);
  }

  if (isProtected && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    const roleForPath = path.startsWith("/customer")
      ? "customer"
      : path.startsWith("/agent")
        ? "agent"
        : "admin";

    if (role !== roleForPath) {
      const url = request.nextUrl.clone();

      url.pathname =
        role === "admin"
          ? "/admin"
          : role === "agent"
            ? "/agent/dashboard"
            : "/customer/dashboard";

      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
