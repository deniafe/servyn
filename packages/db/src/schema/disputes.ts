import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./identity";
import { bookings } from "./booking";

// ── disputes ──────────────────────────────────────────────────────────────────
export const disputes = pgTable(
  "disputes",
  {
    id: text("id").primaryKey(), // ULID
    bookingId: text("booking_id")
      .notNull()
      .references(() => bookings.id),
    openedBy: text("opened_by")
      .notNull()
      .references(() => users.id),
    reason: text("reason")
      .notNull()
      .$type<
        "service_not_delivered" | "quality_issue" | "no_show" | "unauthorised_charge" | "other"
      >(),
    description: text("description").notNull(),
    state: text("state")
      .notNull()
      .default("open")
      .$type<"open" | "under_review" | "resolved_customer" | "resolved_vendor" | "closed">(),
    openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("disputes_booking_id_idx").on(t.bookingId),
    index("disputes_opened_by_idx").on(t.openedBy),
    index("disputes_state_idx").on(t.state),
    check(
      "disputes_reason_check",
      sql`${t.reason} IN ('service_not_delivered', 'quality_issue', 'no_show', 'unauthorised_charge', 'other')`,
    ),
    check(
      "disputes_state_check",
      sql`${t.state} IN ('open', 'under_review', 'resolved_customer', 'resolved_vendor', 'closed')`,
    ),
  ],
);

export type DisputeRow = typeof disputes.$inferSelect;
export type NewDisputeRow = typeof disputes.$inferInsert;

// ── evidence ──────────────────────────────────────────────────────────────────
export const evidence = pgTable(
  "evidence",
  {
    id: text("id").primaryKey(), // ULID
    disputeId: text("dispute_id")
      .notNull()
      .references(() => disputes.id),
    submittedBy: text("submitted_by")
      .notNull()
      .references(() => users.id),
    kind: text("kind").notNull().$type<"image" | "document" | "text" | "video">(),
    objectKey: text("object_key"), // R2 private bucket key (null for text evidence)
    body: text("body"), // text evidence body
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("evidence_dispute_id_idx").on(t.disputeId),
    check("evidence_kind_check", sql`${t.kind} IN ('image', 'document', 'text', 'video')`),
  ],
);

export type EvidenceRow = typeof evidence.$inferSelect;
export type NewEvidenceRow = typeof evidence.$inferInsert;
