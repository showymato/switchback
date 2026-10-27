import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "customer",
  "partner_owner",
  "partner_staff",
  "admin",
  "super_admin",
]);
export type UserRole = (typeof userRoleEnum.enumValues)[number];

export const partnerStatusEnum = pgEnum("partner_status", [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "suspended",
]);
export type PartnerStatus = (typeof partnerStatusEnum.enumValues)[number];

export const vehicleCategoryEnum = pgEnum("vehicle_category", [
  "motorcycle",
  "scooter",
  "car",
  "suv",
]);
export type VehicleCategory = (typeof vehicleCategoryEnum.enumValues)[number];

export const vehicleStatusEnum = pgEnum("vehicle_status", [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "published",
  "rejected",
  "suspended",
  "maintenance",
]);
export type VehicleStatus = (typeof vehicleStatusEnum.enumValues)[number];

export const transmissionEnum = pgEnum("transmission", ["manual", "automatic"]);

export const fuelTypeEnum = pgEnum("fuel_type", ["petrol", "diesel", "electric", "hybrid"]);

export const pickupMethodEnum = pgEnum("pickup_method", [
  "partner_counter",
  "hotel_delivery",
  "airport_pickup",
]);
export type PickupMethod = (typeof pickupMethodEnum.enumValues)[number];

export const documentOwnerTypeEnum = pgEnum("document_owner_type", ["partner", "vehicle"]);

export const documentStatusEnum = pgEnum("document_status", [
  "pending",
  "approved",
  "rejected",
  "expired",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "draft",
  "pending_checkout",
  "awaiting_payment",
  "payment_failed",
  "pending_partner_confirmation",
  "confirmed",
  "cancellation_requested",
  "cancelled",
  "pickup_in_progress",
  "active",
  "return_in_progress",
  "completed",
  "refund_pending",
  "partially_refunded",
  "refunded",
  "disputed",
  "expired",
]);
export type BookingStatus = (typeof bookingStatusEnum.enumValues)[number];

export const paymentStatusEnum = pgEnum("payment_status", [
  "created",
  "authorized",
  "captured",
  "failed",
  "refunded",
  "partially_refunded",
]);

export const paymentEventTypeEnum = pgEnum("payment_event_type", [
  "order_created",
  "payment_authorized",
  "payment_captured",
  "payment_failed",
  "refund_initiated",
  "refund_processed",
  "webhook_received",
]);

export const refundStatusEnum = pgEnum("refund_status", [
  "requested",
  "approved",
  "processing",
  "completed",
  "rejected",
]);

export const payoutStatusEnum = pgEnum("payout_status", [
  "pending",
  "processing",
  "paid",
  "failed",
]);

export const ledgerEntryTypeEnum = pgEnum("ledger_entry_type", [
  "booking_credit",
  "commission_debit",
  "refund_debit",
  "adjustment",
  "payout_debit",
]);

export const supportCategoryEnum = pgEnum("support_category", [
  "booking_issue",
  "payment_issue",
  "refund_issue",
  "partner_no_show",
  "vehicle_condition",
  "breakdown_or_incident",
  "eligibility_question",
  "complaint",
  "other",
]);

export const supportPriorityEnum = pgEnum("support_priority", ["low", "normal", "high", "urgent"]);

export const supportStatusEnum = pgEnum("support_status", [
  "open",
  "in_progress",
  "waiting_on_customer",
  "resolved",
  "closed",
]);

export const disputeStatusEnum = pgEnum("dispute_status", [
  "open",
  "investigating",
  "resolved",
  "rejected",
]);

export const inspectionTypeEnum = pgEnum("inspection_type", ["handover", "return"]);

export const chargeReviewStatusEnum = pgEnum("charge_review_status", [
  "alleged",
  "confirmed",
  "disputed",
  "resolved",
]);
