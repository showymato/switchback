-- Server-authoritative double-booking prevention.
-- A generated tstzrange column plus a partial GiST exclusion constraint means Postgres
-- itself rejects any INSERT/UPDATE that would create two overlapping reservations for
-- the same vehicle, for every status that occupies the vehicle's calendar. This holds
-- even under concurrent checkout attempts (the constraint is checked transactionally),
-- which is what a pure application-level availability check cannot guarantee.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "bookings"
  ADD COLUMN "period" tstzrange GENERATED ALWAYS AS (tstzrange("starts_at", "ends_at", '[)')) STORED;

ALTER TABLE "bookings"
  ADD CONSTRAINT "excl_booking_overlap"
  EXCLUDE USING gist ("vehicle_id" WITH =, "period" WITH &&)
  WHERE (
    "status" IN (
      'pending_checkout',
      'awaiting_payment',
      'pending_partner_confirmation',
      'confirmed',
      'pickup_in_progress',
      'active',
      'return_in_progress',
      'cancellation_requested'
    )
  );

ALTER TABLE "bookings"
  ADD CONSTRAINT "booking_period_valid" CHECK ("ends_at" > "starts_at");

CREATE INDEX "idx_bookings_vehicle_period" ON "bookings" USING gist ("vehicle_id", "period");
CREATE INDEX "idx_bookings_customer" ON "bookings" ("customer_user_id");
CREATE INDEX "idx_bookings_status" ON "bookings" ("status");
CREATE INDEX "idx_vehicles_partner" ON "vehicles" ("partner_id");
CREATE INDEX "idx_vehicles_category_status" ON "vehicles" ("category", "status");
CREATE UNIQUE INDEX "idx_vehicles_registration" ON "vehicles" ("registration_number");
