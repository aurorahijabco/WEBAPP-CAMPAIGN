# Aurora Hijab — Voucher Reward Campaign (Production)

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
| Auth       | Custom username + bcrypt password + HttpOnly session cookie (no Supabase Auth) |
| Hosting    | Vercel (frontend) + Supabase Cloud (backend)       |
| Repo       | GitHub → Vercel auto-deploy on push to `main`      |

No business data is stored in `localStorage`. All state lives in Postgres.
Authentication is entirely custom (see §6): Supabase Auth is not used at
all. RLS stays enabled on every table as defense-in-depth, but since there
is no Supabase-issued JWT to populate `auth.uid()`, authorization is
enforced in application code — every authenticated read/write goes through
the service-role client (`lib/supabase/admin.ts`) from server-only code that
has already validated the caller's session (`lib/auth/session.ts`).

---

## 2. Project structure

```
app/
  (auth)/           # register, login, agent-login, admin-login + shared actions.ts
  customer/         # dashboard, claims (new/detail), vouchers, notifications, profile
  agent/            # dashboard, redeem
  admin/            # overview, claims, receipts (bill verification), content review,
                     # vouchers monitor, branches
  api/cron/         # Vercel Cron endpoint that sweeps voucher phase (RESERVED/ACTIVE/EXPIRED)
components/
  ui/               # Button, Card, Badge, Field (Input/Select/Textarea)
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

- Passwords are hashed with bcrypt (`lib/auth/password.ts`, cost 12) before
  ever touching the database.
- On successful register/login, `lib/auth/session.ts` generates a random
  256-bit token, stores only its SHA-256 hash in `public.sessions`, and sets
  the raw token as an `HttpOnly`, `SameSite=Lax` cookie (`Secure` in
  production). Sessions expire after 30 days.
- Logout (`components/nav/LogoutButton.tsx`) deletes the session row
  server-side (not just the cookie), so a leaked/old token can't be reused.
- `middleware.ts` → `lib/auth/middleware.ts` protects `/customer/*`,
  `/agent/*`, `/admin/*`: it validates the session cookie against
  `public.sessions` (via the service-role client, Edge-compatible) and
  redirects based on `profiles.role` — never trusted from the client. Each
  protected layout (`app/customer/layout.tsx` etc.) re-validates via
  `getCurrentUser()` as defense-in-depth.

Agents must have `profiles.branch_id` set (done by `scripts/seed-users.mjs`
for demo agents, or manually by an admin for real agents — there is
intentionally no self-service agent signup in v1).

---

## 7. OCR (receipts)

v1 defaults every uploaded bill to `status = 'HOLD'` and requires manual
admin verification (`/admin/receipts`). The schema has an `ocr_raw jsonb`
column reserved for a future integration (Google Cloud Vision, AWS Textract,
etc.) — plug it in by:
1. Calling the OCR provider right after the Storage upload in
   `app/customer/actions.ts::createClaim`.
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

## 9. Security checklist

- RLS enabled on every table (never disabled) — after the custom-auth
  migration (`0003_custom_auth.sql`), authenticated-data tables have **no**
  permissive policy left (default-deny for `anon`/`authenticated`), because
  there is no Supabase-issued JWT to populate `auth.uid()` anymore. Every
  real read/write goes through the service-role client, authorized in
  application code by `getCurrentUser()`.
- `SUPABASE_SERVICE_ROLE_KEY` is only imported in `lib/supabase/admin.ts`,
  which uses `import "server-only"` to fail the build if ever imported from
  client code. It is now used broadly (all authenticated Server
  Actions/Components) since it's the only client that can read/write
  post-migration — never exposed to the browser.
- Passwords are hashed with bcrypt (cost 12); session tokens are random
  256-bit values whose SHA-256 hash (not the raw token) is stored in
  `public.sessions`; the raw token lives only in an `HttpOnly` cookie
  (`lib/auth/session.ts`) — never in `localStorage` or client JS.
- All mutations run through Server Actions or Route Handlers — no direct
  client-side writes to sensitive tables (vouchers/notifications are only
  ever written by SECURITY DEFINER SQL functions/triggers, not by direct
  client INSERT).
- All form inputs are validated server-side with `zod` (`lib/business/validation.ts`)
  in addition to HTML5 `required`/`type` attributes.
- Storage bucket `receipts` is private; storage.objects RLS has no
  permissive policy either post-migration (see `0004_storage_custom_auth.sql`)
  — upload and signed-URL generation both happen server-side via the
  service-role client after a session check.
- No secrets committed — `.env*`, `scripts/.seed-credentials.json` are
  gitignored. `.env.example` documents required vars without values.

### Rate limiting
Not implemented in v1 (out of scope for a Vercel + Supabase MVP without a
dedicated edge KV store). If needed, add Upstash Redis + `@upstash/ratelimit`
in the Server Actions for `createClaim`, `submitContent`, and
`redeem_voucher`, keyed by user id / IP.

---

## 10. Known v1 limitations / assumptions (documented, not silently changed)

- Phone/OTP/email auth is not implemented; username + password only, via a
  custom session (see §6) — Supabase Auth is not used.
- Agent accounts are provisioned by admin/seed script, not self-registered.
- OCR defaults to manual admin review (see §7).
- WhatsApp push is a documented integration point, not implemented (see §8).
- `redeem_voucher` amount is entered by the agent at redeem time (not forced
  to the reference price) so partial/adjusted redemptions can be recorded if
  the business ever needs that; the reference price
  (`campaign_settings.redeem_product.reference_price`) is shown as a default.

---

## 11. Regenerating fully-typed Supabase types (optional, recommended)

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > types/database.types.ts
```
`types/domain.ts` is a hand-maintained mirror used throughout the app; you
can progressively replace it with the generated types once your schema
stabilizes.
