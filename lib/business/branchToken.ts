import "server-only";

// Tamper-evident token binding a branch code to the moment the register
// page resolved it from the database. The register page renders the
// branch field as read-only, but a read-only HTML field is only advisory —
// anyone can edit it via devtools before submitting. This HMAC (keyed by
// the service-role secret, never exposed client-side) lets the
// registerCustomer action detect if the submitted branch code was swapped
// for a different one after the page rendered, without needing a session,
// cookie, or extra DB table.
async function getKey(): Promise<CryptoKey> {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toBase64Url(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function signBranchCode(code: string): Promise<string> {
  const key = await getKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(code));
  return toBase64Url(signature);
}

export async function verifyBranchToken(code: string, token: string): Promise<boolean> {
  const expected = await signBranchCode(code);
  if (expected.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  return diff === 0;
}
