# Compliance register

Tracks what is confirmed, what is assumed, and what still needs a qualified professional
(lawyer, chartered accountant, or licensed transport consultant) before launch. Nothing in this
document is legal advice; it records engineering decisions and open questions so they aren't lost.

**No official government source was consulted while building this** — this environment has no
browsing capability connected to this build session, and the person requesting this build did not
supply source documents. Every "Open" item below needs that research before `/terms`,
`/privacy`, and `/cancellation-policy` can be treated as final. Those pages render clearly marked
"draft, pending legal review" banners in the running app for exactly this reason.

| Area | Status | Notes |
|---|---|---|
| Rent-a-Motorcycle Scheme, 1997 / Rent-a-Cab Scheme, 1989 applicability | **Open** | Partner onboarding collects an optional `rentalSchemeLicenceNumber` field but does not enforce that a partner hold one, or determine which of their vehicle categories actually require it under current rules. Needs confirmation of current applicability and any HP-specific adaptation. |
| Himachal Pradesh transport department vehicle/operator licensing | **Open** | Partner application collects GSTIN and PAN but no state transport department registration/licence number beyond the generic scheme field above. |
| Motor Vehicles Act / Central Motor Vehicles Rules (driver eligibility, permits) | **Partially addressed, unverified** | Each vehicle lists free-text `eligibilityRequirements` (e.g. "valid licence held 1+ year") set by the partner at listing time, reviewed by an admin for plausibility — not validated against the current Act/Rules text. |
| Vehicle insurance covering commercial rental use | **Open — not collected at all** | `vehicle_documents` has a `document_type` field that could hold an insurance document reference, but there is no document upload flow yet (see `docs/known-limitations.md`), so insurance proof is not actually captured or checked before a vehicle is approved in this build. |
| Vehicle fitness, registration, tax status | **Open — not verified** | `vehicles.registrationNumber` is captured and required, but not checked against any registry; no fitness certificate or road tax proof is collected. |
| Driving licence verification | **Open** | Customer driving licence number is captured (`customer_profiles.drivingLicenceNumber`, and per-booking `driver_licence_number`) but never verified against DigiLocker/Sarathi or any licence registry — it's trusted as entered. |
| Route/permit restrictions (Rohtang Pass, Atal Tunnel approach, inner-line areas) | **Open, flagged in copy** | `/rental-requirements` explicitly states we don't guarantee any route is open or permitted and tells customers to confirm locally. This is a disclaimer, not a compliance control. |
| Consumer protection / e-commerce rules (Consumer Protection (E-Commerce) Rules, 2020) | **Open** | Partner identity, pricing breakdown, and grievance path (support cases) exist; a formal grievance-officer designation and the specific disclosures these rules require have not been checked against the current rule text. |
| GST / invoicing | **Open, held at zero** | `pricing.ts` hardcodes `taxPaise = 0` with a comment flagging this. Whether Switchback (as marketplace facilitator) or the partner is liable for GST on the rental fee, and the correct treatment of the commission, needs a chartered accountant's input before this can be anything but zero. No tax invoice is generated. |
| Payment aggregator / marketplace settlement rules (RBI) | **Open** | The Razorpay integration (`src/server/services/paymentProvider.ts`) creates plain orders against the platform's own account — it does not use Razorpay Route or another RBI-compliant marketplace settlement product, which has its own onboarding/KYC. Collecting customer payment and later crediting partners via an internal ledger, without that licensed settlement arrangement, is very likely **not** compliant for a live marketplace handling third-party funds at scale and needs a payments-compliance review before real money moves. |
| Data protection (Digital Personal Data Protection Act, 2023) | **Open** | `/privacy` is an explicit draft. Consent capture, a documented lawful basis per data category, a grievance officer, and breach-notification procedure are not implemented. |
| Cybersecurity / incident response | **Open** | No documented incident-response procedure exists beyond the audit log (`admin_audit_logs`) and the engineering practices in `src/lib/auth.ts` (hashed passwords, hashed session tokens, role checks server-side). |
| Terms, cancellation, refund, liability, grievance procedures | **Draft, in-product** | `/terms`, `/cancellation-policy` exist and are functionally wired to the actual booking/refund code (the policy shown matches what `src/server/services/pricing.ts` and `cancellation.ts` actually compute) but the legal language itself is unreviewed. |

## What *is* solid, independent of the above

These are implemented and verified (see `docs/test-report.md`), and don't depend on the legal
items above being resolved:

- Server-authoritative pricing and a database-level guarantee against double-booking (Postgres
  exclusion constraint, not just an application check).
- Immutable price snapshots per booking, so a later price change never retroactively changes
  what a customer already agreed to pay.
- Idempotent payment webhook/event processing.
- Role-based, server-side authorization on every privileged action (not just hidden UI).
- An append-only audit log for admin actions and an append-only booking status history.
