/**
 * Seed demo accounts (1 admin, 1 agent per branch, 1 customer) using the
 * Supabase Admin API — auth.users cannot be created safely via plain SQL
 * because passwords must go through GoTrue's hashing.
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

async function createUser({ email, password, name, username, whatsapp, role, branchCode }) {
  const { data: userRes, error: userErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (userErr) throw userErr;

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
    id: userRes.user.id,
    role,
    name,
    username,
    whatsapp,
    branch_id,
    agreed_sk_at: new Date().toISOString(),
  });
  if (profileErr) throw profileErr;

  return { email, password, role, username };
}

async function main() {
  const results = [];

  results.push(
    await createUser({
      email: "admin@aurorahijab.demo",
      password: randomPassword(),
      name: "Aurora Admin",
      username: "aurora_admin",
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
        email: `agent.${b.code.toLowerCase()}@aurorahijab.demo`,
        password: randomPassword(),
        name: `Agent ${b.name}`,
        username: `agent_${b.code.toLowerCase()}`,
        whatsapp: `+62811000000${String(i).padStart(2, "0")}`,
        role: "agent",
        branchCode: b.code,
      })
    );
    i++;
  }

  results.push(
    await createUser({
      email: "customer@aurorahijab.demo",
      password: randomPassword(),
      name: "Aurora Customer Demo",
      username: "aurora_customer",
      whatsapp: "+6281199999999",
      role: "customer",
    })
  );

  writeFileSync(
    new URL("./.seed-credentials.json", import.meta.url),
    JSON.stringify(results, null, 2)
  );

  console.table(results.map(({ email, password, role }) => ({ email, password, role })));
  console.log("\nSaved to scripts/.seed-credentials.json (gitignored). Rotate before production traffic.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
