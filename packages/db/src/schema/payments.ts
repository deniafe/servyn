import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { vendorProfiles } from "./identity";

// ── fee_waivers ───────────────────────────────────────────────────────────────
export const feeWaivers = pgTable(
  "fee_waivers",
  {
    id: text("id").primaryKey(), // ULID
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendorProfiles.id),
    kind: text("kind").notNull().$type<"early_adopter" | "promo">(),
    startsOn: timestamp("starts_on", { withTimezone: true }).notNull(),
    endsOn: timestamp("ends_on", { withTimezone: true }).notNull(),
    feeOverrideBps: integer("fee_override_bps").notNull(), // basis points; 0 = fee-free
    promoCode: text("promo_code"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("fee_waivers_vendor_id_idx").on(t.vendorId),
    index("fee_waivers_promo_code_idx").on(t.promoCode),
    check("fee_waivers_kind_check", sql`${t.kind} IN ('early_adopter', 'promo')`),
  ],
);

export type FeeWaiverRow = typeof feeWaivers.$inferSelect;
export type NewFeeWaiverRow = typeof feeWaivers.$inferInsert;

// ── payments ──────────────────────────────────────────────────────────────────
export const payments = pgTable(
  "payments",
  {
    id: text("id").primaryKey(), // ULID
    bookingId: text("booking_id"), // exactly one of bookingId / orderId is set
    orderId: text("order_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    amountMinor: integer("amount_minor").notNull(), // pence
    vendorShareMinor: integer("vendor_share_minor").notNull(), // pence
    platformFeeMinor: integer("platform_fee_minor").notNull(), // pence
    state: text("state")
      .notNull()
      .default("requires_payment")
      .$type<
        | "requires_payment"
        | "processing"
        | "held"
        | "releasable"
        | "released"
        | "refund_pending"
        | "refunded"
        | "disputed"
        | "under_review"
        | "error"
      >(),
    heldAt: timestamp("held_at", { withTimezone: true }),
    releasableAt: timestamp("releasable_at", { withTimezone: true }),
    releasedAt: timestamp("released_at", { withTimezone: true }),
    releaseBasis: text("release_basis").$type<"completion_confirm" | "auto_48h" | "delivery">(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("payments_booking_id_idx").on(t.bookingId),
    index("payments_order_id_idx").on(t.orderId),
    index("payments_state_idx").on(t.state),
    index("payments_stripe_pi_idx").on(t.stripePaymentIntentId),
    check(
      "payments_booking_or_order_check",
      sql`(${t.bookingId} IS NOT NULL AND ${t.orderId} IS NULL) OR (${t.bookingId} IS NULL AND ${t.orderId} IS NOT NULL)`,
    ),
    check(
      "payments_state_check",
      sql`${t.state} IN ('requires_payment', 'processing', 'held', 'releasable', 'released', 'refund_pending', 'refunded', 'disputed', 'under_review', 'error')`,
    ),
    check(
      "payments_release_basis_check",
      sql`${t.releaseBasis} IS NULL OR ${t.releaseBasis} IN ('completion_confirm', 'auto_48h', 'delivery')`,
    ),
  ],
);

export type PaymentRow = typeof payments.$inferSelect;
export type NewPaymentRow = typeof payments.$inferInsert;

// ── transfers ─────────────────────────────────────────────────────────────────
export const transfers = pgTable(
  "transfers",
  {
    id: text("id").primaryKey(), // ULID
    paymentId: text("payment_id")
      .notNull()
      .references(() => payments.id),
    stripeTransferId: text("stripe_transfer_id").notNull(),
    amountMinor: integer("amount_minor").notNull(), // pence
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("transfers_payment_id_idx").on(t.paymentId),
    index("transfers_stripe_transfer_id_idx").on(t.stripeTransferId),
  ],
);

export type TransferRow = typeof transfers.$inferSelect;
export type NewTransferRow = typeof transfers.$inferInsert;

// ── refunds ───────────────────────────────────────────────────────────────────
export const refunds = pgTable(
  "refunds",
  {
    id: text("id").primaryKey(), // ULID
    paymentId: text("payment_id")
      .notNull()
      .references(() => payments.id),
    stripeRefundId: text("stripe_refund_id").notNull(),
    amountMinor: integer("amount_minor").notNull(), // pence
    vendorShareReturnedMinor: integer("vendor_share_returned_minor").notNull(), // pence
    reason: text("reason")
      .notNull()
      .$type<"vendor_cancel" | "customer_cancel" | "dispute_resolved" | "admin">(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("refunds_payment_id_idx").on(t.paymentId),
    index("refunds_stripe_refund_id_idx").on(t.stripeRefundId),
    check(
      "refunds_reason_check",
      sql`${t.reason} IN ('vendor_cancel', 'customer_cancel', 'dispute_resolved', 'admin')`,
    ),
  ],
);

export type RefundRow = typeof refunds.$inferSelect;
export type NewRefundRow = typeof refunds.$inferInsert;
