/**
 * Seed demo accounts (1 admin, 1 agent per branch, 1 customer) directly into
 * public.profiles using this project's custom username+password+session auth
 * (no Supabase Auth involved — passwords are hashed with bcryptjs, same as
 * lib/auth/password.ts).
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-users.mjs
 *
 * All demo passwords are printed to the console AND written to
 * scripts/.seed-credentials.json (gitignored). Rotate/delete these accounts
 * before going live with real customers.
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
import bcrypt from "bcryptjs";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function randomPassword() {
  return "Aur0ra!" + Math.random().toString(36).slice(-8);
}

async function createUser({ username, password, name, whatsapp, role, branchCode }) {
  const password_hash = await bcrypt.hash(password, 12);

  let branch_id = null;
  if (branchCode) {
    const { data: branch, error: branchErr } = await admin
      .from("branches")
      .select("id")
      .eq("code", branchCode)
      .single();
    if (branchErr) throw branchErr;
    branch_id = branch.id;
  }

  const { error: profileErr } = await admin.from("profiles").insert({
    role,
    name,
    username,
    whatsapp,
    branch_id,
    password_hash,
    agreed_sk_at: new Date().toISOString(),
  });
  if (profileErr) throw profileErr;

  return { username, password, role };
}

async function main() {
  const results = [];

  results.push(
    await createUser({
      username: "aurora_admin",
      password: randomPassword(),
      name: "Aurora Admin",
      whatsapp: "+6281100000001",
      role: "admin",
    })
  );

  const { data: branches, error } = await admin
    .from("branches")
    .select("code, name")
    .order("code");
  if (error) throw error;

  let i = 2;
  for (const b of branches) {
    results.push(
      await createUser({
        username: `agent_${b.code.toLowerCase()}`,
        password: randomPassword(),
        name: `Agent ${b.name}`,
        whatsapp: `+62811000000${String(i).padStart(2, "0")}`,
        role: "agent",
        branchCode: b.code,
      })
    );
    i++;
  }

  results.push(
    await createUser({
      username: "aurora_customer",
      password: randomPassword(),
      name: "Aurora Customer Demo",
      whatsapp: "+6281199999999",
      role: "customer",
    })
  );

  writeFileSync(
    new URL("./.seed-credentials.json", import.meta.url),
    JSON.stringify(results, null, 2)
  );

  console.table(results.map(({ username, password, role }) => ({ username, password, role })));
  console.log("\nSaved to scripts/.seed-credentials.json (gitignored). Rotate before production traffic.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
