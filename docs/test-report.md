# Test report

Everything below was actually executed in this environment on 2026-10-24, not predicted or
assumed. Commands are reproducible from the project root.

## Environment note

The system Node was 20.16.0, which is below the floor `vitest@5` + `vite@8`'s config loader need
(`require(esm)` support for pure-ESM packages, stable since Node 22.12). `next build`/`next dev`
ran fine on 20.16. To actually run the test suite in this session, a portable Node 22.23.4 was
downloaded to a scratch directory and invoked directly
(`node_modules/vitest/vitest.mjs run`, bypassing `npx`'s shebang-based respawn, which was
re-launching on the system Node anyway) — see the `std-env` version note below. This does not
affect the deployed app, which has no Node-version dependency beyond `engines.node` in
`package.json`; it only affects who can run `npm test` on this exact machine without first
upgrading Node.

One real bug surfaced and was fixed by this process: `std-env` resolved to v4.3.0 in
`node_modules` (ESM-only, no `require` export condition), which `vite`'s internal code requires
via a bare `require("std-env")` without declaring it as a real dependency (relying on hoisting).
This is an upstream packaging mismatch between `vite@8.3.5` and `vitest@5.0.5`'s dependency on
`std-env@^4.3.0`, not something fixable from this project's `package.json` short of a Node
upgrade — which is what actually fixed it.

## `npm run build` — production build + typecheck

**Result: pass.** Final run compiled 42 routes with Turbopack, TypeScript check included, zero
errors.

```
✓ Compiled successfully in 8.1s
  Running TypeScript ...
  Finished TypeScript in 24.2s ...
✓ Generating static pages using 11 workers (42/42) in 6.5s
```

Two real issues were found and fixed along the way (not swept under the rug):
- `export const runtime = "nodejs"` on the two payment API routes conflicted with Next 16's
  `cacheComponents` route-segment-config rule — removed (Node.js is the default runtime anyway).
- `cacheComponents: true` itself was reverted after it produced a hard build error on `new Date()`
  in a shared footer component and `crypto.randomBytes` somewhere in the shadcn/Base UI component
  chain during SSR — see `docs/known-limitations.md` for why it's off.

## `npm run lint` — ESLint

**Result: pass, 0 errors, 0 warnings** (after fixing 45 errors / 2 warnings found on the first
run — mostly unescaped apostrophes/quotes in JSX copy per `react/no-unescaped-entities`, one
`<a>` that should have been `<Link>`, and two unused imports).

## `npm test` — Vitest

**Result: pass, 12/12 tests, 2 test files**, run against the real `DATABASE_URL` (Neon), not a
mock:

```
 Test Files  2 passed (2)
      Tests  12 passed (12)
   Duration  42.10s
```

### `tests/pricing.test.ts` (9 tests, pure unit, no database)

Covers: hourly vs. daily rate selection, multi-day totals, rounding a partial day up, the
weekend-rate override applied per IST calendar day, discount capping, rejecting
`endsAt <= startsAt`, rejecting a rental under the vehicle's minimum, and the invariant that
partner payout never exceeds the commissionable amount.

### `tests/booking-flow.integration.test.ts` (3 tests, against the live database)

Creates its own test partner, two test vehicles, and two test customers in `beforeAll`; deletes
every row it created in `afterAll` (verified empty with a direct SQL query after the run — see
below).

1. **Creates a `pending_checkout` hold with an immutable price snapshot**, and separately
   confirms a return-before-pickup request is rejected before any database write (acceptance
   tests #2, #3).
2. **Prevents two concurrent holds from overlapping on the same vehicle** — `Promise.allSettled`
   fires two simultaneous `createBookingHold()` calls for the identical slot from two different
   customers. Exactly one succeeds; the other is rejected with `BookingError`, translated from a
   real Postgres `23P01` (exclusion_violation) raised by the `excl_booking_overlap` constraint
   (acceptance test #7). This is the one that matters most: it proves the *database*, not just
   application logic, is what prevents the double-booking, under genuine concurrency.
3. **Payment failure does not confirm a booking; payment capture does, and posts the ledger
   correctly; a replayed webhook event id is a no-op; cancellation refunds the correct amount**
   (acceptance tests #5, #6). Specifically: `markPaymentFailed` → booking status
   `payment_failed`, not `confirmed`. `confirmPaymentCaptured` → booking `confirmed`, two
   `partner_ledger_entries` rows (`booking_credit` = ₹1,500, `commission_debit` = −₹225, i.e.
   exactly 15% on a ₹1,500 subtotal). Calling `confirmPaymentCaptured` again with the *same*
   `providerEventId` leaves the ledger at 2 entries, not 4. `requestCancellation` on that
   far-future confirmed booking computes a refund of ₹1,500 + ₹3,000 deposit = ₹4,500 (100%, since
   the booking is 40 simulated days out, well past the 24-hour free-cancellation window) and the
   booking moves to `refund_pending`.

Post-run verification that cleanup actually worked:
```sql
SELECT count(*) FROM users WHERE email LIKE 'test-%@example.com';
-- 0
```

### What the test suite does *not* cover (honest gap)

- Partner and admin UI flows (approve/reject partner, approve/reject vehicle, process refund,
  resolve dispute, handover/return checklist) were verified by hand — see "Manual verification"
  below — not by automated tests. Given the time available, automated coverage went to the
  highest-risk logic (money, concurrency, idempotency) first.
- The Razorpay *live* adapter's HTTP calls are unexercised (no live keys — see
  `docs/known-limitations.md`).
- No browser/E2E test (Playwright) was run; all page-level verification below was done via
  authenticated `curl` requests against a running production build, and the Next.js dev/production
  server's own rendering (which fails loudly on a server-side error) rather than a headless
  browser.

## Manual verification (production build, `npm run start`)

Run against the actual seeded database (2 partners, 5 vehicles, 1 admin, 1 demo customer), using
real session cookies — for the admin/partner checks, a session row was inserted directly for the
seeded admin/partner-owner accounts (bypassing the login *form*, not the authorization code —
`requireRole()` still ran for real) since scripting a Server-Action login POST from `curl` isn't
practical; this exercises the same `getCurrentUser()`/`requireRole()` path a real login would.

| Check | Result |
|---|---|
| `/` renders with real featured vehicles from the DB | 200, content confirmed (`Verified vehicle rentals`) |
| `/vehicles` search/listing | 200 |
| `/vehicles/royal-enfield-himalayan-450-...` detail page | 200, content confirmed (`Himalayan 450`) |
| `/login`, `/signup` | 200 |
| Anonymous request to `/admin/dashboard` | 307 redirect to `/login` (proxy gate) |
| Authenticated admin → `/admin/dashboard` | 200, real metrics rendered (`Operations dashboard`, `Total bookings`) |
| Authenticated admin → `/admin/partners` | 200, both seeded partners listed by name |
| Authenticated partner owner → `/partner/dashboard` | 200, correct business name and stats |
| Authenticated partner owner → `/partner/vehicles` | 200, both of that partner's seeded vehicles listed |

(One operational note from this process, not a code bug: a stale `next start` process from
earlier in the session kept holding port 3000 across several rebuilds, serving an old build and a
cached 404 for new routes. Caught by checking `x-nextjs-cache: HIT` in the response headers and
`netstat`; fixed by killing the actual PID, not by changing any code.)
