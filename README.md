# Switchback

A booking marketplace for verified vehicle rentals (motorcycles, scooters, self-drive cars,
self-drive SUVs) in Manali, Himachal Pradesh. Built with Next.js 16 (App Router), Drizzle ORM,
and a Neon Postgres database.

This is an MVP implementation of the full specification in the project brief. See
[`docs/known-limitations.md`](docs/known-limitations.md) for what is **not** yet production-ready,
and [`docs/compliance-register.md`](docs/compliance-register.md) for legal/regulatory open items.
[`docs/test-report.md`](docs/test-report.md) records what was actually run and its results.

## Stack

- **Framework**: Next.js 16 (App Router, Server Actions, Node.js runtime)
- **Database**: Postgres via [Neon](https://neon.tech) — `drizzle-orm` + `@neondatabase/serverless`
- **UI**: Tailwind CSS v4 + shadcn/ui (Base UI primitives, not Radix — components use the `render` prop, not `asChild`)
- **Payments**: Razorpay, behind a provider interface with an isolated sandbox adapter (see "Payments" below)
- **Auth**: Custom session-cookie auth (bcrypt password hashing, SHA-256-hashed session tokens in the `sessions` table) — no third-party auth provider

## Requirements

- **Node.js ≥ 22.12** to run the test suite (`vitest` 5 + `vite` 8's config loader need
  `require(esm)` support, stable since Node 22.12). The app itself (`next dev`/`next build`/`next start`)
  runs fine on Node ≥ 20.18, but **this project was developed and primarily tested in an
  environment where the system Node was 20.16 — too old for `npm test`.** If you hit
  `ERR_REQUIRE_ESM` or `SyntaxError: ... does not provide an export named 'isAgent'` running tests,
  upgrade Node; there is no workaround in `package.json` for this, it's a real Node-version floor.
- A Neon (or any Postgres 16+) database. Neon is assumed for `pg_version: 18` and `gen_random_uuid()`.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL at minimum — see below
npm run db:migrate           # applies drizzle/*.sql, including the booking-overlap guard
npm run db:seed              # creates an admin user, a demo customer, 2 demo partners, 5 vehicles
npm run dev
```

### Database setup

1. Create a Postgres database (Neon: `neon.tech` → New Project).
2. Put its connection string in `.env.local` as `DATABASE_URL`.
3. `npm run db:migrate` runs everything in `drizzle/`, in order:
   - `0000_*.sql` — generated from `src/db/schema/*.ts` via `drizzle-kit generate`
   - `0001_booking_overlap_guard.sql` — **hand-written**, not generated. It adds a
     `btree_gist`-backed, partial `EXCLUDE` constraint on `bookings(vehicle_id, tstzrange(starts_at, ends_at))`,
     scoped to the statuses that occupy a vehicle's calendar (see
     `src/server/services/availability.ts#OCCUPYING_STATUSES` — keep the two in sync if you change
     either). This is the actual mechanism that makes double-booking impossible, verified under
     real concurrency in `tests/booking-flow.integration.test.ts`. Because `drizzle-kit` can't
     express `EXCLUDE` constraints, this migration is tracked in `drizzle/meta/_journal.json`
     with a duplicated snapshot (`0001_snapshot.json` = a copy of `0000_snapshot.json`), so future
     `drizzle-kit generate` runs continue to work for ordinary schema changes.
4. If you change `src/db/schema/*.ts`, run `npm run db:generate` to create a new numbered
   migration, then `npm run db:migrate`.
5. `npm run db:studio` opens Drizzle Studio against the same `DATABASE_URL`.

### Admin bootstrap

`npm run db:seed` creates a `super_admin` user from `ADMIN_BOOTSTRAP_EMAIL` /
`ADMIN_BOOTSTRAP_PASSWORD` in `.env.local` (defaults: `admin@switchback.test` /
`ChangeMe123!` if unset). **Change this password immediately in a real deployment** — the seed
script is meant for development, not for provisioning a production admin account. For
production, insert the first admin directly via SQL with a properly generated bcrypt hash, or
build a one-time CLI bootstrap script before going live (not included here).

The seed script also creates:
- A demo customer: `customer@switchback.test` / `Passw0rd!123`
- Two demo (pre-approved) partners: `ridgeline@switchback.test`, `highpass@switchback.test`, both `Passw0rd!123`
- Five published demo vehicles across all four categories

### Payments

The payment integration is a provider interface (`src/server/services/paymentProvider.ts`) with
two implementations:

- **Sandbox adapter** (default, used whenever `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` /
  `RAZORPAY_WEBHOOK_SECRET` are not all set). Checkout shows explicit "Simulate: Pay now
  (success)" / "Simulate: Payment fails" buttons — nothing here is presented as a real payment.
  `/api/payments/sandbox-confirm` only responds while the sandbox adapter is active; it 404s the
  instant real keys are configured, so it can never be hit in a real-money deployment by mistake.
- **Razorpay adapter**: real order creation and signature verification against Razorpay's API.
  **This has not been tested against a live Razorpay account** — no such account or test keys
  were available in this environment. It calls `orders.create` on the platform's own merchant
  account; it does **not** use Razorpay Route/split-settlement, which needs its own marketplace
  onboarding and KYC with Razorpay that this project has not gone through. Partner payout stays an
  internal ledger entry (`partner_ledger_entries`) rather than an automatic transfer — see
  `docs/known-limitations.md`.

To go live:
1. Get Razorpay API keys and a webhook secret from the Razorpay dashboard.
2. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
3. Point a Razorpay webhook at `https://<your-domain>/api/payments/webhook` for at least
   `payment.captured` and `payment.failed` events.
4. Build a real checkout UI calling Razorpay's `Checkout.js` with the order from
   `createPaymentOrderAction` (the current sandbox UI's "pay now" buttons are replaced by that
   flow — see the `isSandbox` branch in `src/components/checkout/CheckoutPanel.tsx`).
5. Test a real ₹1 payment end to end before trusting it with real bookings.

### File storage (partner/vehicle documents)

Not implemented. `partner_documents` and `vehicle_documents` tables exist in the schema with a
`file_key` column, but there is no upload UI or Vercel Blob wiring yet — see
`docs/known-limitations.md`. `BLOB_READ_WRITE_TOKEN` is reserved in `.env.example` for this.

### Email/SMS notifications

Not implemented. The `notifications` table exists; nothing currently writes to it or calls an
email/SMS provider. `RESEND_API_KEY` is reserved in `.env.example`.

## Testing

```bash
npm test          # vitest run — needs Node >=22.12, see "Requirements"
npm run build     # production build + typecheck
npm run lint      # eslint
```

`tests/pricing.test.ts` is pure unit tests for the pricing engine (no database).
`tests/booking-flow.integration.test.ts` runs against the **real** database in `DATABASE_URL` —
it creates its own test partner/vehicles/customers, exercises hold creation, a genuine concurrent
double-booking race (`Promise.allSettled` on two simultaneous holds for the same slot), payment
capture + idempotent webhook replay, ledger posting, and cancellation refund math, then deletes
everything it created in `afterAll`. See `docs/test-report.md` for the actual run output.

## Deployment (Vercel)

1. `vercel link`, then `vercel env add` for every variable in `.env.example` (or `vercel env pull`
   after setting them in the dashboard).
2. Set `NEXT_PUBLIC_APP_URL` to the real deployment URL (used in the sitemap and for absolute links).
3. Run `npm run db:migrate` against the production `DATABASE_URL` as a one-off step before the
   first deploy (it is not run automatically on deploy in this setup).
4. `vercel deploy --prod`.
5. Point the Razorpay webhook at the production domain (see "Payments" above).
6. This repo has not actually been deployed to Vercel in this environment — no Vercel project was
   linked. The build (`next build`) was verified locally; see `docs/test-report.md`.

### Rollback

Standard Vercel instant-rollback to a previous deployment. The one thing rollback does **not**
undo is a database migration — `drizzle/0001_booking_overlap_guard.sql` added a constraint, which
would need its own down-migration (not written) if you needed to revert it after data relying on
it existed.

## Architecture notes

- **Money** is stored as integer paise everywhere (`*_paise` columns), never floats.
- **Timezone**: the business operates in `Asia/Kolkata` (no DST), handled with a fixed +05:30
  offset rather than a timezone library — see `src/lib/format.ts` and the IST-parsing comments in
  `src/server/actions/booking.ts` and `src/components/vehicles/VehicleResultsPage.tsx`.
- **Booking state machine**: `src/server/services/bookingStateMachine.ts` is the only place
  `bookings.status` is allowed to change from application code; it enforces the transition table
  and writes an immutable `booking_status_events` row for every change. Admins can force an
  off-table transition, but only with a reason, which gets logged as "admin override".
- **Pricing** is computed once, server-side, in `src/server/services/pricing.ts`, and snapshotted
  into `booking_price_snapshots` at hold-creation time — a later edit to a vehicle's price never
  changes an existing booking's agreed total.
- **Authorization**: `src/lib/auth.ts#requireRole()` is called at the top of every protected
  Server Action and page — not just gated by `src/proxy.ts`, which only does a coarse
  cookie-presence redirect before a protected page renders (see the comment in `proxy.ts` for why
  that's intentionally not the real security boundary).
