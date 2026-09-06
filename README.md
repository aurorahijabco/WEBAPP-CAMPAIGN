# Aurora Hijab — Voucher Reward Campaign (Production)

**Status:** 🟢 Live — https://webapp-campaign.vercel.app/

Next.js 15 (App Router) + Supabase (Postgres, Storage — not Auth) + Vercel.

Converts the original single-file HTML/localStorage prototype into a real,
multi-role, database-backed application: **Customer**, **Agent (per branch)**,
and **Super Admin**.

---

## 1. Stack

| Layer      | Tech                                              |
|------------|----------------------------------------------------|
| Frontend   | Next.js 15 App Router, TypeScript, Tailwind CSS    |
| Backend    | Supabase Postgres, Storage, SQL functions/triggers (RLS enabled, deny-by-default) |
| Auth       | Custom credential-based session auth (no Supabase Auth) |
| Hosting    | Vercel (frontend) + Supabase Cloud (backend)       |
| Repo       | GitHub → Vercel auto-deploy on push to `main`      |

No business data is stored in `localStorage`. All state lives in Postgres.
Authentication is entirely custom (see §6): Supabase Auth is not used at
all. RLS stays enabled on every table as defense-in-depth; authorization is
enforced in application code, gated behind a validated server-side session.
Implementation specifics are intentionally not documented here since this
repo is public — see the `lib/auth/` source directly if you need to work on
that layer.

---

## 2. Project structure

```
app/
  (auth)/           # register, login, agent-login, admin-login + shared actions.ts
  customer/         # dashboard, claims (new/detail), vouchers, notifications, profile
  agent/            # dashboard (incl. per-branch registration QR card), redeem
  admin/            # overview, claims, receipts (bill verification), content review,
                     # vouchers monitor, branches, agents, audit-log
  api/cron/         # Vercel Cron endpoint that sweeps voucher phase (RESERVED/ACTIVE/EXPIRED)
components/
  ui/               # Button, Card, Badge, Field (Input/Select/Textarea, password show/hide)
  nav/              # BottomNav (customer), SidebarNav (agent/admin), LogoutButton
lib/
  auth/             # crypto.ts (edge-safe token gen/hash), password.ts (bcrypt),
                     # session.ts (createSession/getCurrentUser/destroySession),
                     # middleware.ts (custom session validation + route guard)
  supabase/         # server.ts (public anon-key client, landing page only),
                     # admin.ts (service-role client — all authenticated access)
  business/         # validation.ts (zod schemas mirroring business rules)
  constants.ts, utils.ts
types/
  domain.ts         # hand-written types mirroring the DB schema
supabase/
  migrations/0001_init.sql          # full schema + functions/triggers + seed
  migrations/0002_storage.sql       # private `receipts` bucket + storage policies
  migrations/0003_custom_auth.sql   # drops Supabase Auth dependency, adds
                                     # profiles.password_hash + sessions table
  migrations/0004_storage_custom_auth.sql # tightens receipts bucket policies to match
  migrations/0005_redeem_uses_voucher_value.sql # redeem amount defaults to voucher value
  migrations/0006_agent_delete_fk_safety.sql     # FK safety when deleting agents
  migrations/0007_qr_branch_tracking.sql         # branches.code used for QR registration links
  migrations/0008_receipt_ocr.sql                # ocr_raw column (see §7)
  migrations/0009_audit_logs.sql                 # audit_logs table (see §9)
scripts/
  seed-users.mjs    # creates demo accounts (admin/agents/customer) with hashed passwords
middleware.ts       # route protection for /customer, /agent, /admin
```

---

## 3. Business rules encoded (read before changing anything)

- **Reward is NOT cumulative.** Value = highest verified tier:
  Story Photo 20.000 · Feed Photo 30.000 · Feed Reels 40.000 ·
  all three APPROVED → capped at 50.000.
  Implemented in `compute_reward_value()` (SQL) — see `0001_init.sql`.
- Voucher is only created/updated when the underlying **bill/struk is VALID**
  and at least one content tier is APPROVED (`sync_voucher_for_claim()`).
- Voucher phase is derived from `campaign_settings.redemption_period`
  (`before` → RESERVED, `during` → ACTIVE, `after` → EXPIRED, unless already
  REDEEMED). Never hardcoded in the client — read from DB via
  `campaign_phase()`.
- **Redeem** (`redeem_voucher()` SQL function, called via RPC from
  `app/agent/actions.ts`) enforces, server-side:
  - caller is an `agent`
  - voucher's `branch_id` matches the agent's own `branch_id`
  - current phase is `during`
  - voucher `status = 'ACTIVE'` (not REDEEMED/EXPIRED/RESERVED)
  - a Series Sarimbit product name is provided
- Rejected content **can be resubmitted** without buying again — the UI keeps
  the submission form open per tier until that tier is APPROVED.
- Potential duplicate bills (same customer + branch + amount within 24h) are
  auto-flagged (`claims.flagged`) for admin review, not auto-rejected.
- Content URL must be `http(s)://` (validated both client + server + DB check
  via zod `contentSubmissionSchema`).

If you need to change any of the above, edit `0001_init.sql` **and**
`lib/business/validation.ts` together — they are the two sources of truth.

---

## 4. Local setup

### 4.1 Prerequisites
- Node.js 20+
- A Supabase project (free tier is fine to start): https://supabase.com/dashboard

### 4.2 Clone & install
```bash
git clone <your-repo-url> aurora-hijab-voucher
cd aurora-hijab-voucher
npm install
```

### 4.3 Configure environment
```bash
cp .env.example .env.local
```
Fill in from Supabase Dashboard → Project Settings → API:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Settings → API → `service_role` — **server only, never commit, never expose to the client**)

### 4.4 Run database migrations
Option A — Supabase CLI (recommended):
```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```
Option B — manual: open Supabase Dashboard → SQL Editor → paste and run
`supabase/migrations/0001_init.sql`, then `supabase/migrations/0002_storage.sql`,
in that order.

This creates all tables, RLS policies, business-logic functions/triggers, the
`receipts` storage bucket + policies, and seed data (10 branches +
`campaign_settings`).

### 4.5 Seed demo accounts (admin / agent per branch / customer)
`auth.users` cannot be created with plain SQL (passwords need GoTrue's
hashing), so this is a small Node script using the Supabase Admin API:

```bash
SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
node scripts/seed-users.mjs
```

This prints (and saves to the **gitignored** `scripts/.seed-credentials.json`)
one admin account, one agent account per seeded branch, and one demo
customer, each with a randomly generated password.

> ⚠️ These are demo credentials. Rotate or delete them before opening the
> campaign to real customers/agents.

### 4.6 Run the app
```bash
npm run dev
```
Open http://localhost:3000

---

## 5. Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel: **New Project → Import from GitHub** → select the repo.
3. Framework preset: Next.js (auto-detected).
4. Add environment variables in Vercel → Project Settings → Environment
   Variables (Production + Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (your production URL)
   - `CRON_SECRET` (any random string; used to protect the cron endpoint)
5. Deploy. Every push to `main` auto-deploys (GitHub → Vercel integration).
6. `vercel.json` already schedules the voucher-phase sweeper
   (`/api/cron/sweep-voucher-phase`) every 15 minutes via Vercel Cron — no
   extra setup needed once the project is on a plan that supports Cron Jobs.
   Alternatively, if your Supabase plan has `pg_cron`, you can schedule
   `sweep_voucher_phase()` directly in Postgres (commented example at the
   bottom of `0001_init.sql`).

---

## 6. Roles & login

| Role     | Login page       | Redirect after login     |
|----------|-------------------|---------------------------|
| Customer | `/login`           | `/customer/dashboard`     |
| Agent    | `/agent-login`     | `/agent/dashboard`        |
| Admin    | `/admin-login`     | `/admin`                  |

Login/register are **username + password**, not email. There is no email,
email verification, OTP, or magic link anywhere in this app.

Passwords are hashed before storage; sessions are cookie-based and validated
server-side on every request to a protected route (`/customer/*`, `/agent/*`,
`/admin/*`), with role checked from the database rather than trusted from the
client. See `lib/auth/` for the actual mechanics — deliberately not spelled
out here since this repo is public.

Agents must have `profiles.branch_id` set (done by `scripts/seed-users.mjs`
for demo agents, or manually by an admin for real agents — there is
intentionally no self-service agent signup in v1).

Password fields (login/register/agent-login/admin-login) have a show/hide
toggle (`components/ui/Field.tsx` `PasswordInput`) — cosmetic only, no
change to validation or session handling.

Each agent's dashboard shows a QR code (`app/agent/dashboard/BranchQrCard.tsx`)
encoding that agent's own branch registration link (`/?branch=<branches.code>`),
resolved server-side from the agent's session `branch_id` — an agent can
never view or generate a QR for another branch.

---

## 7. OCR (receipts)

v1 defaults every uploaded bill to `status = 'HOLD'` and requires manual
admin verification (`/admin/receipts`). The schema has an `ocr_raw jsonb`
column reserved for a future integration (Google Cloud Vision, AWS Textract,
etc.) — plug it in by:
1. Calling the OCR provider right after the Storage upload in
   `app/customer/actions.ts::submitClaimReceipt`.
2. Writing the raw OCR response into `bills.ocr_raw`.
3. Optionally auto-setting `status = 'VALID'` when OCR confidence is high
   (keep a human-review fallback for everything else).

No other flow needs to change — `sync_voucher_for_claim()` already reacts to
`bills.status` transitions via the `bills_after_update` trigger.

---

## 8. WhatsApp notifications (placeholder)

In-app notifications (`public.notifications`) are fully implemented and
realtime-ready (Supabase Realtime can be enabled on that table if desired).

WhatsApp push is **not wired up in v1** — env vars are reserved
(`WHATSAPP_PROVIDER`, `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`).
To add it later:
1. Create a Supabase Database Webhook (or a small Edge Function) that fires
   on `INSERT` into `public.notifications`.
2. Forward the payload to Meta Cloud API (or your provider) using the
   customer's `profiles.whatsapp`.
3. Keep in-app notifications as the source of truth; WhatsApp becomes a
   delivery channel on top.

---

## 9. Audit log (Super Admin)

Server-side actions write to `public.audit_logs` (`0009_audit_logs.sql`):
auth events, claim/OCR outcomes, content/voucher lifecycle transitions,
admin writes on agents/branches, and unauthorized access attempts. Writes
happen only from trusted server code (never the client) and never fail the
underlying action if logging itself errors.

RLS is enabled with **no policies** — same deny-by-default pattern as
`sessions` — so only the service-role client, gated by the existing
admin-only `/admin` layout, can read it; Customers and Agents have no path
to view or tamper with entries. Browsable, filterable (search, action/role/
branch/status/date) at `/admin/audit-log`.

---

## 10. Security checklist

This repo is public, so implementation specifics that would help an attacker
are intentionally not detailed here — see the source under `lib/auth/`,
`lib/supabase/`, and the `supabase/migrations/` RLS policies directly if you
need to work on this layer. At a high level:

- RLS is enabled on every table; authorization is enforced in server-side
  application code, not left to the client.
- Server-only secrets are confined to server-only code paths and never
  exposed to the browser.
- All mutations go through Server Actions / Route Handlers with server-side
  validation — no direct client writes to sensitive tables.
- The `receipts` storage bucket is private; file access is only ever
  brokered server-side.
- No secrets are committed — `.env*` and generated credential files are
  gitignored.

---

## 11. Known v1 limitations / assumptions (documented, not silently changed)

- Phone/OTP/email auth is not implemented; username + password only, via a
  custom session (see §6) — Supabase Auth is not used.
- Agent accounts are provisioned by admin/seed script, not self-registered.
- OCR defaults to manual admin review (see §7) — a Gemini Vision
  integration was tried and later removed in favor of this manual flow.
- WhatsApp push is a documented integration point, not implemented (see §8).
- `redeem_voucher` amount is entered by the agent at redeem time (not forced
  to the reference price) so partial/adjusted redemptions can be recorded if
  the business ever needs that; the reference price
  (`campaign_settings.redeem_product.reference_price`) is shown as a default.

---

## 12. Regenerating fully-typed Supabase types (optional, recommended)

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > types/database.types.ts
```
`types/domain.ts` is a hand-maintained mirror used throughout the app; you
can progressively replace it with the generated types once your schema
stabilizes.
