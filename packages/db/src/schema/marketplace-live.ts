import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./identity";

// ── live_listings ─────────────────────────────────────────────────────────────
export const liveListings = pgTable(
  "live_listings",
  {
    id: text("id").primaryKey(),
    kind: text("kind").notNull().$type<"service" | "product">(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => users.id),
    ownerName: text("owner_name").notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    category: text("category").notNull(),
    area: text("area").notNull(),
    address: text("address"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    description: text("description").notNull(),
    priceMinor: integer("price_minor").notNull(),
    bulkPriceMinor: integer("bulk_price_minor"),
    minBulkQty: integer("min_bulk_qty"),
    durationMins: integer("duration_mins"),
    stock: integer("stock"),
    unit: text("unit"),
    photos: jsonb("photos").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("live_listings_slug_idx").on(t.slug),
    index("live_listings_kind_idx").on(t.kind),
    index("live_listings_owner_idx").on(t.ownerUserId),
    check("live_listings_kind_check", sql`${t.kind} IN ('service', 'product')`),
  ],
);

export type LiveListingRow = typeof liveListings.$inferSelect;
export type NewLiveListingRow = typeof liveListings.$inferInsert;

// ── live_conversations ────────────────────────────────────────────────────────
export const liveConversations = pgTable(
  "live_conversations",
  {
    id: text("id").primaryKey(),
    kind: text("kind").notNull().$type<"service" | "product">(),
    listingId: text("listing_id"),
    listingTitle: text("listing_title").notNull(),
    area: text("area").notNull(),
    customerUserId: text("customer_user_id")
      .notNull()
      .references(() => users.id),
    customerName: text("customer_name").notNull(),
    providerUserId: text("provider_user_id").references(() => users.id),
    providerName: text("provider_name").notNull(),
    providerSlug: text("provider_slug").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("live_conversations_customer_idx").on(t.customerUserId),
    index("live_conversations_provider_idx").on(t.providerUserId),
    index("live_conversations_updated_idx").on(t.updatedAt),
    check("live_conversations_kind_check", sql`${t.kind} IN ('service', 'product')`),
  ],
);

export type LiveConversationRow = typeof liveConversations.$inferSelect;
export type NewLiveConversationRow = typeof liveConversations.$inferInsert;

// ── live_messages ─────────────────────────────────────────────────────────────
export const liveMessages = pgTable(
  "live_messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => liveConversations.id),
    senderUserId: text("sender_user_id"),
    senderRole: text("sender_role").notNull().$type<"customer" | "provider">(),
    senderName: text("sender_name").notNull(),
    body: text("body").notNull(),
    invoiceId: text("invoice_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("live_messages_conversation_idx").on(t.conversationId),
    index("live_messages_created_idx").on(t.createdAt),
    check("live_messages_role_check", sql`${t.senderRole} IN ('customer', 'provider')`),
  ],
);

export type LiveMessageRow = typeof liveMessages.$inferSelect;
export type NewLiveMessageRow = typeof liveMessages.$inferInsert;

// ── live_invoices ─────────────────────────────────────────────────────────────
export type LiveInvoiceStatus =
  | "sent"
  | "paid_held"
  | "delivered"
  | "disputed"
  | "released"
  | "refunded";

export const liveInvoices = pgTable(
  "live_invoices",
  {
    id: text("id").primaryKey(),
    refId: text("ref_id").notNull(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => liveConversations.id),
    kind: text("kind").notNull().$type<"service" | "product">(),
    customerUserId: text("customer_user_id")
      .notNull()
      .references(() => users.id),
    customerName: text("customer_name").notNull(),
    providerUserId: text("provider_user_id").references(() => users.id),
    providerName: text("provider_name").notNull(),
    title: text("title").notNull(),
    agreedDate: text("agreed_date"),
    agreedLocation: text("agreed_location"),
    originalAmountMinor: integer("original_amount_minor"),
    discountNote: text("discount_note"),
    referralApplied: boolean("referral_applied").notNull().default(false),
    subtotalMinor: integer("subtotal_minor").notNull(),
    feeMinor: integer("fee_minor").notNull(),
    totalMinor: integer("total_minor").notNull(),
    status: text("status").notNull().default("sent").$type<LiveInvoiceStatus>(),
    disputed: boolean("disputed").notNull().default(false),
    disputeReason: text("dispute_reason"),
    stripeSessionId: text("stripe_session_id"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    customerConfirmedAt: timestamp("customer_confirmed_at", { withTimezone: true }),
    providerConfirmedAt: timestamp("provider_confirmed_at", { withTimezone: true }),
    autoReleaseAt: timestamp("auto_release_at", { withTimezone: true }),
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    disputedAt: timestamp("disputed_at", { withTimezone: true }),
    releasedAt: timestamp("released_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("live_invoices_ref_id_idx").on(t.refId),
    index("live_invoices_conversation_idx").on(t.conversationId),
    index("live_invoices_customer_idx").on(t.customerUserId),
    index("live_invoices_provider_idx").on(t.providerUserId),
    check("live_invoices_kind_check", sql`${t.kind} IN ('service', 'product')`),
    check(
      "live_invoices_status_check",
      sql`${t.status} IN ('sent', 'paid_held', 'delivered', 'disputed', 'released', 'refunded')`,
    ),
  ],
);

export type LiveInvoiceRow = typeof liveInvoices.$inferSelect;
export type NewLiveInvoiceRow = typeof liveInvoices.$inferInsert;

// ── live_reviews ──────────────────────────────────────────────────────────────
export const liveReviews = pgTable(
  "live_reviews",
  {
    id: text("id").primaryKey(),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => liveInvoices.id),
    providerName: text("provider_name").notNull(),
    providerUserId: text("provider_user_id"),
    title: text("title").notNull(),
    rating: integer("rating").notNull(),
    comment: text("comment").notNull(),
    authorUserId: text("author_user_id")
      .notNull()
      .references(() => users.id),
    authorName: text("author_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("live_reviews_invoice_id_idx").on(t.invoiceId),
    index("live_reviews_provider_idx").on(t.providerUserId),
    check("live_reviews_rating_check", sql`${t.rating} >= 1 AND ${t.rating} <= 5`),
  ],
);

export type LiveReviewRow = typeof liveReviews.$inferSelect;
export type NewLiveReviewRow = typeof liveReviews.$inferInsert;
