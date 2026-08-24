import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Flips voucher status RESERVED -> ACTIVE at redemption start, and
 * ACTIVE/RESERVED -> EXPIRED after redemption end. Call this on a schedule.
 *
 * Configure in vercel.json as a Vercel Cron Job, e.g. every 15 minutes:
 *   { "crons": [{ "path": "/api/cron/sweep-voucher-phase", "schedule": "0/15 * * * *" }] }
 *
 * Protect with CRON_SECRET (set in Vercel env vars) — Vercel Cron sends it
 * automatically as a Bearer token when configured.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("sweep_voucher_phase");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ranAt: new Date().toISOString() });
}
