import { sql } from "drizzle-orm";
import { check, index, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

// ── webhook_events ────────────────────────────────────────────────────────────
// Idempotency / deduplication table. Every incoming Stripe/Clerk/external
// webhook event is inserted here before processing; a unique constraint on
// (provider, event_id) prevents double-processing on retries.
export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: text("id").primaryKey(), // ULID
    provider: text("provider").notNull().$type<"stripe" | "clerk" | "inngest">(),
    eventId: text("event_id").notNull(), // provider's own event/message ID
    type: text("type").notNull(), // e.g. "payment_intent.succeeded"
    state: text("state")
      .notNull()
      .default("received")
      .$type<"received" | "processing" | "processed" | "failed">(),
    payload: jsonb("payload").notNull(), // raw JSON payload — stored for audit/replay
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("webhook_events_provider_event_id_idx").on(t.provider, t.eventId),
    index("webhook_events_state_idx").on(t.state),
    index("webhook_events_type_idx").on(t.type),
    check("webhook_events_provider_check", sql`${t.provider} IN ('stripe', 'clerk', 'inngest')`),
    check(
      "webhook_events_state_check",
      sql`${t.state} IN ('received', 'processing', 'processed', 'failed')`,
    ),
  ],
);

export type WebhookEventRow = typeof webhookEvents.$inferSelect;
export type NewWebhookEventRow = typeof webhookEvents.$inferInsert;
