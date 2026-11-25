import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users, vendorProfiles } from "./identity";
import { bookings } from "./booking";
import { orders } from "./commerce";

// ── reviews ───────────────────────────────────────────────────────────────────
// A review may only be created from a `completed` booking or `completed` order,
// by that booking/order's customer, once. Enforced at the repository / service layer.
export const reviews = pgTable(
  "reviews",
  {
    id: text("id").primaryKey(), // ULID
    bookingId: text("booking_id").references(() => bookings.id), // nullable; XOR with orderId
    orderId: text("order_id").references(() => orders.id), // nullable; XOR with bookingId
    customerId: text("customer_id")
      .notNull()
      .references(() => users.id),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendorProfiles.id),
    rating: integer("rating").notNull(), // 1–5
    body: text("body"),
    moderationState: text("moderation_state")
      .notNull()
      .default("pending")
      .$type<"pending" | "published" | "hidden">(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("reviews_booking_id_idx").on(t.bookingId),
    index("reviews_order_id_idx").on(t.orderId),
    index("reviews_vendor_id_idx").on(t.vendorId),
    index("reviews_moderation_state_idx").on(t.moderationState),
    check(
      "reviews_booking_or_order_check",
      sql`(${t.bookingId} IS NOT NULL AND ${t.orderId} IS NULL) OR (${t.bookingId} IS NULL AND ${t.orderId} IS NOT NULL)`,
    ),
    check("reviews_rating_range_check", sql`${t.rating} >= 1 AND ${t.rating} <= 5`),
    check(
      "reviews_moderation_state_check",
      sql`${t.moderationState} IN ('pending', 'published', 'hidden')`,
    ),
  ],
);

export type ReviewRow = typeof reviews.$inferSelect;
export type NewReviewRow = typeof reviews.$inferInsert;
