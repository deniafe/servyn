import { sql } from "drizzle-orm";
import { boolean, check, index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./identity";

// ── conversations ─────────────────────────────────────────────────────────────
export const conversations = pgTable(
  "conversations",
  {
    id: text("id").primaryKey(), // ULID
    bookingId: text("booking_id"), // exactly one of bookingId / orderId is set
    orderId: text("order_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("conversations_booking_id_idx").on(t.bookingId),
    index("conversations_order_id_idx").on(t.orderId),
    check(
      "conversations_booking_or_order_check",
      sql`(${t.bookingId} IS NOT NULL AND ${t.orderId} IS NULL) OR (${t.bookingId} IS NULL AND ${t.orderId} IS NOT NULL)`,
    ),
  ],
);

export type ConversationRow = typeof conversations.$inferSelect;
export type NewConversationRow = typeof conversations.$inferInsert;

// ── messages ──────────────────────────────────────────────────────────────────
// Append-only: no UPDATE/DELETE exposed at the repository layer.
// Redaction is a dedicated transition (`redact`) that sets body to null
// and redacted = true; it never deletes the row.
export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey(), // ULID
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id),
    senderId: text("sender_id")
      .notNull()
      .references(() => users.id),
    body: text("body"), // null when redacted
    attachments: jsonb("attachments"), // parsed with MessageAttachmentsSchema at repo
    redacted: boolean("redacted").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("messages_conversation_id_idx").on(t.conversationId),
    index("messages_created_at_idx").on(t.createdAt),
  ],
);

export type MessageRow = typeof messages.$inferSelect;
export type NewMessageRow = typeof messages.$inferInsert;
