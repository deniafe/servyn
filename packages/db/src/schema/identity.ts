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
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { geometry } from "../geometry";

// ── users ─────────────────────────────────────────────────────────────────────
export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(), // ULID
    clerkUserId: text("clerk_user_id").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    status: text("status").notNull().default("active").$type<"active" | "suspended" | "deleted">(),
    isAdmin: boolean("is_admin").notNull().default(false),
    consentPreferences: jsonb("consent_preferences"), // parsed with ConsentPreferencesSchema at repo
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("users_clerk_user_id_idx").on(t.clerkUserId),
    uniqueIndex("users_email_idx").on(t.email),
    check("users_status_check", sql`${t.status} IN ('active', 'suspended', 'deleted')`),
  ],
);

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;

// ── customer_profiles ─────────────────────────────────────────────────────────
export const customerProfiles = pgTable(
  "customer_profiles",
  {
    id: text("id").primaryKey(), // ULID
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    displayName: text("display_name").notNull(),
    defaultLocation: jsonb("default_location"), // parsed with DefaultLocationSchema at repo
    ageConfirmedAt: timestamp("age_confirmed_at", { withTimezone: true }),
    marketingOptIn: boolean("marketing_opt_in").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("customer_profiles_user_id_idx").on(t.userId)],
);

export type CustomerProfileRow = typeof customerProfiles.$inferSelect;
export type NewCustomerProfileRow = typeof customerProfiles.$inferInsert;

// ── vendor_profiles ───────────────────────────────────────────────────────────
export const vendorProfiles = pgTable(
  "vendor_profiles",
  {
    id: text("id").primaryKey(), // ULID
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    businessName: text("business_name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    serviceArea: geometry("service_area"),
    stripeAccountId: text("stripe_account_id"),
    isSeller: boolean("is_seller").notNull().default(false),
    verificationStatus: text("verification_status")
      .notNull()
      .default("unverified")
      .$type<"unverified" | "pending" | "verified" | "rejected">(),
    ratingAvg: integer("rating_avg").notNull().default(0), // stored * 100 (e.g. 450 = 4.50)
    ratingCount: integer("rating_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("vendor_profiles_user_id_idx").on(t.userId),
    uniqueIndex("vendor_profiles_slug_idx").on(t.slug),
    index("vendor_profiles_service_area_gist_idx").using("gist", sql`${t.serviceArea}`),
    check(
      "vendor_profiles_verification_status_check",
      sql`${t.verificationStatus} IN ('unverified', 'pending', 'verified', 'rejected')`,
    ),
  ],
);

export type VendorProfileRow = typeof vendorProfiles.$inferSelect;
export type NewVendorProfileRow = typeof vendorProfiles.$inferInsert;

// ── vendor_members ────────────────────────────────────────────────────────────
// Schema seam for Phase 4 team/vendor org accounts (A11). No UI in MVP.
export const vendorMembers = pgTable(
  "vendor_members",
  {
    id: text("id").primaryKey(), // ULID
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendorProfiles.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    role: text("role").notNull().default("member").$type<"owner" | "member">(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("vendor_members_vendor_user_idx").on(t.vendorId, t.userId),
    check("vendor_members_role_check", sql`${t.role} IN ('owner', 'member')`),
  ],
);

export type VendorMemberRow = typeof vendorMembers.$inferSelect;
export type NewVendorMemberRow = typeof vendorMembers.$inferInsert;

// ── verifications ─────────────────────────────────────────────────────────────
export const verifications = pgTable(
  "verifications",
  {
    id: text("id").primaryKey(), // ULID
    vendorId: text("vendor_id")
      .notNull()
      .references(() => vendorProfiles.id),
    kind: text("kind")
      .notNull()
      .$type<"identity" | "business" | "dbs" | "qualification" | "reference">(),
    state: text("state")
      .notNull()
      .default("pending")
      .$type<"unverified" | "pending" | "verified" | "rejected" | "expired">(),
    objectKey: text("object_key"), // R2 private bucket key
    expiresOn: timestamp("expires_on", { withTimezone: true }),
    metadata: jsonb("metadata"), // parsed with VerificationMetadataSchema at repo
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("verifications_vendor_id_idx").on(t.vendorId),
    check(
      "verifications_kind_check",
      sql`${t.kind} IN ('identity', 'business', 'dbs', 'qualification', 'reference')`,
    ),
    check(
      "verifications_state_check",
      sql`${t.state} IN ('unverified', 'pending', 'verified', 'rejected', 'expired')`,
    ),
  ],
);

export type VerificationRow = typeof verifications.$inferSelect;
export type NewVerificationRow = typeof verifications.$inferInsert;

// ── safeguarding_reports ──────────────────────────────────────────────────────
// Append-only: no UPDATE/DELETE exposed at the repository layer.
export const safeguardingReports = pgTable(
  "safeguarding_reports",
  {
    id: text("id").primaryKey(), // ULID
    bookingId: text("booking_id").notNull(), // FK enforced at app layer (avoid circular dep)
    reporterId: text("reporter_id")
      .notNull()
      .references(() => users.id),
    description: text("description").notNull(),
    state: text("state")
      .notNull()
      .default("open")
      .$type<"open" | "under_review" | "resolved" | "closed">(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("safeguarding_reports_booking_id_idx").on(t.bookingId),
    index("safeguarding_reports_reporter_id_idx").on(t.reporterId),
    check(
      "safeguarding_reports_state_check",
      sql`${t.state} IN ('open', 'under_review', 'resolved', 'closed')`,
    ),
  ],
);

export type SafeguardingReportRow = typeof safeguardingReports.$inferSelect;
export type NewSafeguardingReportRow = typeof safeguardingReports.$inferInsert;
