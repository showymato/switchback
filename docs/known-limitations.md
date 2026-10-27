# Known limitations and launch gates

Honest list of what this build does **not** do yet, organized by what has to happen before it
could take real money from real customers.

## Must fix before any real launch

1. **No document upload for partner/vehicle verification documents.** `partner_documents` and
   `vehicle_documents` tables exist with a `file_key` column, and the partner-onboarding and
   vehicle-listing flows mention documents in their copy, but there is no actual upload UI, no
   Vercel Blob (or other storage) wiring, and admin approval currently has no document to check
   against. An admin can approve a partner/vehicle today based only on the text fields they typed
   in — this is the single biggest gap between this build and the spec's "compliance gates" intent.
2. **Razorpay integration is unverified against a real account.** No Razorpay keys were available
   in this environment. The sandbox adapter is well-tested (see test report); the real adapter's
   order creation and signature verification code exists and follows Razorpay's documented
   HMAC-SHA256 scheme, but has never made a real API call. Test with a real ₹1 transaction before
   trusting it.
3. **No split-settlement / Razorpay Route.** Partner payout is an internal ledger balance
   (`partner_ledger_entries`), not an automated transfer. There is no payout-execution code at
   all — an admin would currently have to pay partners manually and there's no UI to even mark a
   `partner_payouts` row as paid (the table exists; nothing writes to it).
4. **No rate limiting.** Login, signup, and checkout endpoints have no brute-force or abuse
   protection. For production, add Vercel Firewall rules or an application-level rate limiter
   (e.g. Upstash Ratelimit) on `/login`, `/signup`, and the payment endpoints at minimum.
5. **Legal pages are drafts.** See `docs/compliance-register.md`.

## Should fix soon

6. **No email/SMS notifications.** The `notifications` table and the spec's event list exist in
   intent only — nothing calls an email or SMS provider on booking confirmation, cancellation,
   partner approval, etc. Customers and partners only find out about status changes by visiting
   the app.
7. **No background job for expired-hold cleanup.** Expired holds are released *lazily* — only
   when something else touches that same vehicle (a new booking attempt, or an availability
   check). A hold that expires on a vehicle nobody else tries to book will sit in `pending_checkout`
   / `awaiting_payment` status indefinitely until someone does. It's correctly excluded from
   availability calculations either way (see `src/server/services/availability.ts`), but the
   `bookings.status` column itself won't say "expired" until something triggers the check. A
   Vercel Cron hitting a small `/api/internal/release-expired-holds` route would fix the cosmetic
   half of this; it was not built here.
8. **No analytics event tracking.** Spec §15 lists specific funnel events (search submitted,
   checkout started, etc.) — none are emitted. There's no PostHog/GA/Segment wiring.
9. **Partner staff accounts aren't usable yet.** The `partner_members` table and the
   `partner_staff` role exist, but every partner action in this build is gated through
   `getPartnerForOwner()`, which only matches `partners.ownerUserId`. A `partner_staff` user has
   no actual path to reach a partner's data today.
10. **No pagination.** Admin booking/vehicle/partner lists and partner booking lists load
    everything (capped at 100 for the largest admin query) rather than paging. Fine for a demo
    dataset, not fine at scale.
11. **Vehicle editing isn't built.** A partner can create a vehicle and block maintenance dates,
    but there's no "edit vehicle" form — fixing a typo in a listed price today means going
    through Drizzle Studio or SQL directly.
12. **No image upload for vehicles.** `vehicle_images` exists; there's no UI to add one. Every
    vehicle currently renders an illustrated category placeholder (see
    `src/components/vehicles/VehiclePlaceholder.tsx`) rather than a real photo, by design — we did
    not want to fabricate stock photography and present it as the actual vehicle.

## Deliberate scope cuts (per spec §17, "ship after initial validation")

Not built, and not meant to be yet: loyalty programs, native apps, dynamic/seasonal pricing beyond
the simple weekend-rate override already in `pricing.ts`, multi-city operations, automated damage
assessment from photos, corporate accounts, partner subscription tiers, and a dispatch/roadside
network.

## Things that look unfinished but are intentional

- **Proxy-level route protection is coarse on purpose.** `src/proxy.ts` only checks for the
  *presence* of a session cookie before redirecting to `/login`; it never decodes it or checks a
  role. Every actual authorization decision happens via `requireRole()` inside the page/layout or
  Server Action itself, which is the only place that can safely query the database. This is
  explained in a comment in `proxy.ts` — it is not an oversight, and removing the proxy check
  entirely wouldn't reduce security, since nothing relies on it as the real boundary.
- **`cacheComponents` (Next.js 16's PPR) is off.** Several Base UI / shadcn components call
  `crypto.randomBytes` or similar non-deterministic APIs during SSR for id generation, which Next's
  stricter prerenderer treats as a hard build error under Cache Components. Turning it back on is
  possible but would need auditing (or patching) every third-party component that does this first.
