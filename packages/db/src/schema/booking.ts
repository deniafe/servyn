import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users, vendorProfiles } from "./identity";
import { services } from "./catalog";

// ── availability_rules ────────────────────────────────────────────────────────
export const availabilityRules = pgTable(
  "availability_rules",
  {
    id: text("id").primaryKey(), // ULID
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendorProfiles.id),
    weekday: integer("weekday").notNull(), // 0=Sun … 6=Sat
    start: time("start").notNull(),
    end: time("end").notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("availability_rules_vendor_id_idx").on(t.vendorId),
    check("availability_rules_weekday_check", sql`${t.weekday} >= 0 AND ${t.weekday} <= 6`),
  ],
);

export type AvailabilityRuleRow = typeof availabilityRules.$inferSelect;
export type NewAvailabilityRuleRow = typeof availabilityRules.$inferInsert;

// ── availability_exceptions ───────────────────────────────────────────────────
export const availabilityExceptions = pgTable(
  "availability_exceptions",
  {
    id: text("id").primaryKey(), // ULID
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendorProfiles.id),
    date: timestamp("date", { withTimezone: true }).notNull(),
    kind: text("kind").notNull().$type<"unavailable" | "available_override">(),
    start: time("start"),
    end: time("end"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("availability_exceptions_vendor_date_idx").on(t.vendorId, t.date),
    check(
      "availability_exceptions_kind_check",
      sql`${t.kind} IN ('unavailable', 'available_override')`,
    ),
  ],
);

export type AvailabilityExceptionRow = typeof availabilityExceptions.$inferSelect;
export type NewAvailabilityExceptionRow = typeof availabilityExceptions.$inferInsert;

// ── policy_versions ───────────────────────────────────────────────────────────
// Append-only: each booking pins the PolicyVersion in force at booking time.
export const policyVersions = pgTable(
  "policy_versions",
  {
    id: text("id").primaryKey(), // ULID
    version: text("version").notNull(),
    cancellationRules: jsonb("cancellation_rules").notNull(), // parsed at repo
    refundRules: jsonb("refund_rules").notNull(), // parsed at repo
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("policy_versions_version_idx").on(t.version)],
);

export type PolicyVersionRow = typeof policyVersions.$inferSelect;
export type NewPolicyVersionRow = typeof policyVersions.$inferInsert;

// ── quotes ────────────────────────────────────────────────────────────────────
export const quotes = pgTable(
  "quotes",
  {
    id: text("id").primaryKey(), // ULID
    customerId: text("customer_id")
      .notNull()
      .references(() => users.id),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendorProfiles.id),
    state: text("state")
      .notNull()
      .default("requested")
      .$type<"requested" | "quoted" | "accepted" | "declined">(),
    request: jsonb("request").notNull(), // parsed at repo
    quoteLines: jsonb("quote_lines"), // parsed at repo
    totalMinor: integer("total_minor"), // pence; set when vendor quotes
    bookingId: text("booking_id"), // set when accepted; FK at app layer
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("quotes_customer_id_idx").on(t.customerId),
    index("quotes_vendor_id_idx").on(t.vendorId),
    check("quotes_state_check", sql`${t.state} IN ('requested', 'quoted', 'accepted', 'declined')`),
  ],
);

export type QuoteRow = typeof quotes.$inferSelect;
export type NewQuoteRow = typeof quotes.$inferInsert;

// ── bookings ──────────────────────────────────────────────────────────────────
export const bookings = pgTable(
  "bookings",
  {
    id: text("id").primaryKey(), // ULID
    customerId: text("customer_id")
      .notNull()
      .references(() => users.id),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendorProfiles.id),
    serviceId: text("service_id")
      .notNull()
      .references(() => services.id),
    quoteId: text("quote_id"), // FK at app layer
    bookingModel: text("booking_model").notNull().$type<"request" | "instant" | "quote">(),
    status: text("status")
      .notNull()
      .default("requested")
      .$type<
        | "requested"
        | "accepted"
        | "declined"
        | "confirmed"
        | "in_progress"
        | "vendor_complete"
        | "completed"
        | "cancelled"
        | "disputed"
        | "under_review"
        | "refunded"
      >(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    grossPriceMinor: integer("gross_price_minor").notNull(), // pence
    vendorShareMinor: integer("vendor_share_minor").notNull(), // pence
    platformFeeMinor: integer("platform_fee_minor").notNull(), // pence
    paymentId: text("payment_id"), // FK at app layer
    policyVersionId: text("policy_version_id")
      .notNull()
      .references(() => policyVersions.id),
    eventDetails: jsonb("event_details"), // parsed at repo
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("bookings_customer_id_idx").on(t.customerId),
    index("bookings_vendor_id_idx").on(t.vendorId),
    index("bookings_status_idx").on(t.status),
    index("bookings_scheduled_at_idx").on(t.scheduledAt),
    check(
      "bookings_booking_model_check",
      sql`${t.bookingModel} IN ('request', 'instant', 'quote')`,
    ),
    check(
      "bookings_status_check",
      sql`${t.status} IN ('requested', 'accepted', 'declined', 'confirmed', 'in_progress', 'vendor_complete', 'completed', 'cancelled', 'disputed', 'under_review', 'refunded')`,
    ),
  ],
);

export type BookingRow = typeof bookings.$inferSelect;
export type NewBookingRow = typeof bookings.$inferInsert;

// ── booking_events ─────────────────────────────────────────────────────────────
// Append-only FSM audit log. No UPDATE/DELETE at repository layer.
export const bookingEvents = pgTable(
  "booking_events",
  {
    id: text("id").primaryKey(), // ULID
    bookingId: text("booking_id")
      .notNull()
      .references(() => bookings.id),
    status: text("status")
      .notNull()
      .$type<
        | "requested"
        | "accepted"
        | "declined"
        | "confirmed"
        | "in_progress"
        | "vendor_complete"
        | "completed"
        | "cancelled"
        | "disputed"
        | "under_review"
        | "refunded"
      >(),
    actorId: text("actor_id")
      .notNull()
      .references(() => users.id),
    at: bigint("at", { mode: "number" }).notNull(), // epoch-ms
    metadata: jsonb("metadata"), // parsed at repo
  },
  (t) => [
    index("booking_events_booking_id_idx").on(t.bookingId),
    index("booking_events_at_idx").on(t.at),
    check(
      "booking_events_status_check",
      sql`${t.status} IN ('requested', 'accepted', 'declined', 'confirmed', 'in_progress', 'vendor_complete', 'completed', 'cancelled', 'disputed', 'under_review', 'refunded')`,
    ),
  ],
);

export type BookingEventRow = typeof bookingEvents.$inferSelect;
export type NewBookingEventRow = typeof bookingEvents.$inferInsert;

// ── favourites ────────────────────────────────────────────────────────────────
export const favourites = pgTable(
  "favourites",
  {
    id: text("id").primaryKey(), // ULID
    customerId: text("customer_id")
      .notNull()
      .references(() => users.id),
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendorProfiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("favourites_customer_vendor_idx").on(t.customerId, t.vendorId)],
);

export type FavouriteRow = typeof favourites.$inferSelect;
export type NewFavouriteRow = typeof favourites.$inferInsert;
