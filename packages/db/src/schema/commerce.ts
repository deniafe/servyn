import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./identity";
import { products } from "./catalog";

// ── orders ────────────────────────────────────────────────────────────────────
export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(), // ULID
    customerId: text("customer_id")
      .notNull()
      .references(() => users.id),
    sellerId: text("seller_id")
      .notNull()
      .references(() => users.id),
    status: text("status")
      .notNull()
      .default("pending")
      .$type<
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "completed"
        | "cancelled"
        | "refunded"
      >(),
    totalMinor: integer("total_minor").notNull(), // pence
    delivery: jsonb("delivery").notNull(), // parsed with DeliveryDetailsSchema at repo
    paymentId: text("payment_id"), // FK at app layer
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("orders_customer_id_idx").on(t.customerId),
    index("orders_seller_id_idx").on(t.sellerId),
    index("orders_status_idx").on(t.status),
    check(
      "orders_status_check",
      sql`${t.status} IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded')`,
    ),
  ],
);

export type OrderRow = typeof orders.$inferSelect;
export type NewOrderRow = typeof orders.$inferInsert;

// ── order_items ───────────────────────────────────────────────────────────────
export const orderItems = pgTable(
  "order_items",
  {
    id: text("id").primaryKey(), // ULID
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    qty: integer("qty").notNull(),
    unitPriceMinor: integer("unit_price_minor").notNull(), // pence at time of order
    isBulk: boolean("is_bulk").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("order_items_order_id_idx").on(t.orderId)],
);

export type OrderItemRow = typeof orderItems.$inferSelect;
export type NewOrderItemRow = typeof orderItems.$inferInsert;

// ── bulk_enquiries ────────────────────────────────────────────────────────────
export const bulkEnquiries = pgTable(
  "bulk_enquiries",
  {
    id: text("id").primaryKey(), // ULID
    customerId: text("customer_id")
      .notNull()
      .references(() => users.id),
    sellerId: text("seller_id")
      .notNull()
      .references(() => users.id),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    state: text("state")
      .notNull()
      .default("enquired")
      .$type<"enquired" | "quoted" | "converted" | "declined">(),
    request: jsonb("request").notNull(), // parsed with BulkEnquiryRequestSchema at repo
    quoteLines: jsonb("quote_lines"), // parsed with BulkQuoteLinesSchema at repo
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("bulk_enquiries_customer_id_idx").on(t.customerId),
    index("bulk_enquiries_seller_id_idx").on(t.sellerId),
    check(
      "bulk_enquiries_state_check",
      sql`${t.state} IN ('enquired', 'quoted', 'converted', 'declined')`,
    ),
  ],
);

export type BulkEnquiryRow = typeof bulkEnquiries.$inferSelect;
export type NewBulkEnquiryRow = typeof bulkEnquiries.$inferInsert;
