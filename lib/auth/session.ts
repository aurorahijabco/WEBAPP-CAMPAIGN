import "server-only";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSessionToken, hashToken } from "@/lib/auth/crypto";
import type { AppRole } from "@/types/domain";

export const SESSION_COOKIE_NAME = "ah_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type CurrentUser = {
  id: string;
  username: string;
  name: string;
  role: AppRole;
  branchId: string | null;
};

function cookieOptions(maxAgeSeconds?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    ...(maxAgeSeconds !== undefined ? { maxAge: maxAgeSeconds } : {}),
  };
}

/**
 * Creates a new session row for `userId`, sets the HttpOnly session cookie,
 * and returns the raw token (only ever held in the cookie — the database
 * stores just its SHA-256 hash, per the "simpan hash token" requirement).
 */
export async function createSession(userId: string): Promise<void> {
  const token = generateSessionToken();
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const supabase = createAdminClient();
  const { error } = await supabase.from("sessions").insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
  });
  if (error) throw new Error("Gagal membuat sesi: " + error.message);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, cookieOptions(SESSION_DURATION_MS / 1000));
}

/**
 * Reads the session cookie, validates it against the `sessions` table (not
 * expired), and returns the signed-in user's profile — or null if there is
 * no valid session. This is the sole replacement for
 * `supabase.auth.getUser()` throughout the app.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = await hashToken(token);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("expires_at, profiles(id, username, name, role, branch_id)")
    .eq("token_hash", tokenHash)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error || !data || !data.profiles) return null;

  const profile = data.profiles as unknown as {
    id: string;
    username: string;
    name: string;
    role: AppRole;
    branch_id: string | null;
  };

  return {
    id: profile.id,
    username: profile.username,
    name: profile.name,
    role: profile.role,
    branchId: profile.branch_id,
  };
}

/**
 * Deletes the session row from the database (so the token can never be
 * reused, even if it leaked) and clears the cookie. This is the logout path.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = await hashToken(token);
    const supabase = createAdminClient();
    await supabase.from("sessions").delete().eq("token_hash", tokenHash);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}
