// Edge-runtime-safe primitives (Web Crypto only, no Node-only APIs) shared by
// both the Node.js Server Actions/Components (lib/auth/session.ts) and the
// Edge middleware (lib/auth/middleware.ts) so session-token handling is
// identical in both places.

const TOKEN_BYTES = 32; // 256 bits of entropy for the raw session token

export function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(TOKEN_BYTES));
  return base64UrlEncode(bytes);
}

/**
 * SHA-256 of the raw token, hex-encoded. Session tokens are already
 * high-entropy random values (not user-chosen secrets), so a fast
 * general-purpose hash is appropriate here — unlike passwords, which need a
 * slow adaptive hash (see lib/auth/password.ts).
 */
export async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
