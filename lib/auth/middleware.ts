import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/auth/crypto";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import type { AppRole } from "@/types/domain";

/**
 * Runs on every request (Edge runtime). Validates the custom session cookie
 * against the `sessions` table and applies role-based route protection for
 * /customer, /agent, /admin — replacing the old Supabase Auth
 * `supabase.auth.getUser()` + cookie-refresh logic.
 *
 * Uses the service-role client (fetch-based, Edge-compatible) rather than a
 * user-scoped RLS client: there is no Supabase-issued JWT to authenticate as
 * "the user" anymore, so authorization here is enforced entirely in this
 * function (and again in each protected layout as defense in depth), not by
 * Postgres RLS.
 */
export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Match "/admin" and "/admin/…" but not "/admin-login" (same for
  // agent/customer) — a naive startsWith() would treat /agent-login and
  // /admin-login as protected routes, causing a redirect-to-self loop.
  const protectedPrefixes = ["/customer", "/agent", "/admin"];
  const isProtected = protectedPrefixes.some((p) => path === p || path.startsWith(`${p}/`));

  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const loginPathFor = (p: string) =>
    p.startsWith("/agent") ? "/agent-login" : p.startsWith("/admin") ? "/admin-login" : "/login";

  if (!token) {
    return redirectTo(request, loginPathFor(path));
  }

  const tokenHash = await hashToken(token);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("expires_at, profiles(role)")
    .eq("token_hash", tokenHash)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  const role = (data?.profiles as unknown as { role: AppRole } | null)?.role;

  if (error || !data || !role) {
    const res = redirectTo(request, loginPathFor(path));
    res.cookies.delete(SESSION_COOKIE_NAME);
    return res;
  }

  const roleForPath: AppRole = path.startsWith("/customer") ? "customer" : path.startsWith("/agent") ? "agent" : "admin";

  if (role !== roleForPath) {
    const home = role === "admin" ? "/admin" : role === "agent" ? "/agent/dashboard" : "/customer/dashboard";
    return redirectTo(request, home);
  }

  return NextResponse.next();
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.searchParams.delete("next");
  return NextResponse.redirect(url);
}
