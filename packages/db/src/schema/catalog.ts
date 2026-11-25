import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { geometry } from "../geometry";
import { vendorProfiles, users } from "./identity";

// ── categories ────────────────────────────────────────────────────────────────
export const categories = pgTable(
  "categories",
  {
    id: text("id").primaryKey(), // ULID
    parentId: text("parent_id"), // self-referential — no FK to avoid circular
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    kind: text("kind").notNull().$type<"service" | "product">(),
    trustTier: text("trust_tier").notNull().default("standard").$type<"standard" | "enhanced">(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("categories_slug_idx").on(t.slug),
    index("categories_kind_idx").on(t.kind),
    index("categories_parent_id_idx").on(t.parentId),
    check("categories_kind_check", sql`${t.kind} IN ('service', 'product')`),
    check("categories_trust_tier_check", sql`${t.trustTier} IN ('standard', 'enhanced')`),
  ],
);

export type CategoryRow = typeof categories.$inferSelect;
export type NewCategoryRow = typeof categories.$inferInsert;

// ── services ──────────────────────────────────────────────────────────────────
export const services = pgTable(
  "services",
  {
    id: text("id").primaryKey(), // ULID
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendorProfiles.id),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    durationMinutes: integer("duration_minutes").notNull(),
    priceMinor: integer("price_minor").notNull(), // pence
    images: jsonb("images"), // parsed with ServiceImagesSchema at repo
    serviceArea: geometry("service_area"),
    bookingModel: text("booking_model")
      .notNull()
      .default("request")
      .$type<"request" | "instant" | "quote">(),
    listingStatus: text("listing_status")
      .notNull()
      .default("draft")
      .$type<"draft" | "active" | "paused" | "deleted">(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("services_slug_idx").on(t.slug),
    index("services_vendor_id_idx").on(t.vendorId),
    index("services_category_id_idx").on(t.categoryId),
    index("services_listing_status_idx").on(t.listingStatus),
    index("services_service_area_gist_idx").using("gist", sql`${t.serviceArea}`),
    check(
      "services_booking_model_check",
      sql`${t.bookingModel} IN ('request', 'instant', 'quote')`,
    ),
    check(
      "services_listing_status_check",
      sql`${t.listingStatus} IN ('draft', 'active', 'paused', 'deleted')`,
    ),
  ],
);

export type ServiceRow = typeof services.$inferSelect;
export type NewServiceRow = typeof services.$inferInsert;

// ── products ──────────────────────────────────────────────────────────────────
export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(), // ULID
    sellerId: text("seller_id")
      .notNull()
      .references(() => users.id),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    priceMinor: integer("price_minor").notNull(), // pence
    stock: integer("stock").notNull().default(0),
    bulkOptions: jsonb("bulk_options"), // parsed with ProductBulkOptionsSchema at repo
    images: jsonb("images"), // parsed with ProductImagesSchema at repo
    listingStatus: text("listing_status")
      .notNull()
      .default("draft")
      .$type<"draft" | "active" | "paused" | "deleted">(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("products_slug_idx").on(t.slug),
    index("products_seller_id_idx").on(t.sellerId),
    index("products_category_id_idx").on(t.categoryId),
    index("products_listing_status_idx").on(t.listingStatus),
    check(
      "products_listing_status_check",
      sql`${t.listingStatus} IN ('draft', 'active', 'paused', 'deleted')`,
    ),
  ],
);

export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;
