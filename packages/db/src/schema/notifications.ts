import { sql } from "drizzle-orm";
import { check, index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./identity";

// ── notifications ─────────────────────────────────────────────────────────────
export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey(), // ULID
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    channel: text("channel").notNull().$type<"email" | "sms" | "push" | "in_app">(),
    type: text("type").notNull(), // e.g. "BookingConfirmed", "PayoutReleased"
    payload: jsonb("payload").notNull(), // parsed with NotificationPayloadSchema at repo
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("notifications_user_id_idx").on(t.userId),
    index("notifications_channel_idx").on(t.channel),
    index("notifications_read_at_idx").on(t.readAt),
    check("notifications_channel_check", sql`${t.channel} IN ('email', 'sms', 'push', 'in_app')`),
  ],
);

export type NotificationRow = typeof notifications.$inferSelect;
export type NewNotificationRow = typeof notifications.$inferInsert;
