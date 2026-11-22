import "server-only";
import { eq } from "drizzle-orm";
import type { DbExecutor } from "@servyn/db";
import {
  users,
  customerProfiles,
  vendorProfiles,
  vendorMembers,
  verifications,
  safeguardingReports,
  type UserRow,
  type NewUserRow,
  type CustomerProfileRow,
  type NewCustomerProfileRow,
  type VendorProfileRow,
  type NewVendorProfileRow,
  type VendorMemberRow,
  type NewVendorMemberRow,
  type VerificationRow,
  type NewVerificationRow,
  type SafeguardingReportRow,
  type NewSafeguardingReportRow,
} from "@servyn/db";
import {
  asUserId,
  asCustomerId,
  asVendorId,
  asVendorMemberId,
  asBookingId,
  asVerificationId,
  asSafeguardingReportId,
  newUlid,
  type UserId,
  type CustomerId,
  type VendorId,
  type VendorMemberId,
  type BookingId,
  type VerificationId,
  type SafeguardingReportId,
} from "@servyn/core";
import {
  DefaultLocationSchema,
  VerificationMetadataSchema,
  type DefaultLocation,
  type VerificationMetadata,
} from "./schema.js";

// ── Domain types ──────────────────────────────────────────────────────────────

export interface User {
  id: UserId;
  clerkUserId: string;
  email: string;
  phone: string | null;
  status: "active" | "suspended" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerProfile {
  id: CustomerId;
  userId: UserId;
  displayName: string;
  defaultLocation: DefaultLocation | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorProfile {
  id: VendorId;
  userId: UserId;
  businessName: string;
  slug: string;
  description: string | null;
  serviceArea: string | null; // WKT string from PostGIS
  stripeAccountId: string | null;
  verificationStatus: "unverified" | "pending" | "verified" | "rejected";
  ratingAvg: number; // stored * 100 (e.g. 450 = 4.50)
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorMember {
  id: VendorMemberId;
  vendorId: VendorId;
  userId: UserId;
  role: "owner" | "member";
  createdAt: Date;
}

export interface Verification {
  id: VerificationId;
  vendorId: VendorId;
  kind: "identity" | "business" | "dbs" | "qualification" | "reference";
  state: "unverified" | "pending" | "verified" | "rejected" | "expired";
  objectKey: string | null;
  expiresOn: Date | null;
  metadata: VerificationMetadata | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeguardingReport {
  id: SafeguardingReportId;
  bookingId: BookingId;
  reporterId: UserId;
  description: string;
  state: "open" | "under_review" | "resolved" | "closed";
  createdAt: Date;
}

// ── Row-to-domain mappers ─────────────────────────────────────────────────────

export function mapUser(row: UserRow): User {
  return {
    id: asUserId(row.id),
    clerkUserId: row.clerkUserId,
    email: row.email,
    phone: row.phone ?? null,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapCustomerProfile(row: CustomerProfileRow): CustomerProfile {
  const defaultLocation =
    row.defaultLocation !== null && row.defaultLocation !== undefined
      ? DefaultLocationSchema.parse(row.defaultLocation)
      : null;

  return {
    id: asCustomerId(row.id),
    userId: asUserId(row.userId),
    displayName: row.displayName,
    defaultLocation,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapVendorProfile(row: VendorProfileRow): VendorProfile {
  return {
    id: asVendorId(row.id),
    userId: asUserId(row.userId),
    businessName: row.businessName,
    slug: row.slug,
    description: row.description ?? null,
    serviceArea: row.serviceArea ?? null,
    stripeAccountId: row.stripeAccountId ?? null,
    verificationStatus: row.verificationStatus,
    ratingAvg: row.ratingAvg,
    ratingCount: row.ratingCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapVendorMember(row: VendorMemberRow): VendorMember {
  return {
    id: asVendorMemberId(row.id),
    vendorId: asVendorId(row.vendorId),
    userId: asUserId(row.userId),
    role: row.role,
    createdAt: row.createdAt,
  };
}

export function mapVerification(row: VerificationRow): Verification {
  const metadata =
    row.metadata !== null && row.metadata !== undefined
      ? VerificationMetadataSchema.parse(row.metadata)
      : null;

  return {
    id: asVerificationId(row.id),
    vendorId: asVendorId(row.vendorId),
    kind: row.kind,
    state: row.state,
    objectKey: row.objectKey ?? null,
    expiresOn: row.expiresOn ?? null,
    metadata,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapSafeguardingReport(row: SafeguardingReportRow): SafeguardingReport {
  return {
    id: asSafeguardingReportId(row.id),
    bookingId: asBookingId(row.bookingId),
    reporterId: asUserId(row.reporterId),
    description: row.description,
    state: row.state,
    createdAt: row.createdAt,
  };
}

// ── Repository factory ────────────────────────────────────────────────────────

export function createIdentityRepository(executor: DbExecutor) {
  return {
    // ── Users ───────────────────────────────────────────────────────────────

    async insertUser(data: Omit<NewUserRow, "id">): Promise<User> {
      const id = newUlid();
      const [row] = await executor
        .insert(users)
        .values({ ...data, id })
        .returning();
      if (!row) throw new Error("Insert user returned no row");
      return mapUser(row);
    },

    async findUserById(id: UserId): Promise<User | null> {
      const [row] = await executor.select().from(users).where(eq(users.id, id)).limit(1);
      return row ? mapUser(row) : null;
    },

    async findUserByClerkId(clerkUserId: string): Promise<User | null> {
      const [row] = await executor
        .select()
        .from(users)
        .where(eq(users.clerkUserId, clerkUserId))
        .limit(1);
      return row ? mapUser(row) : null;
    },

    async findUserByEmail(email: string): Promise<User | null> {
      const [row] = await executor.select().from(users).where(eq(users.email, email)).limit(1);
      return row ? mapUser(row) : null;
    },

    // ── Customer profiles ───────────────────────────────────────────────────

    async insertCustomerProfile(
      data: Omit<NewCustomerProfileRow, "id" | "defaultLocation"> & {
        defaultLocation?: DefaultLocation;
      },
    ): Promise<CustomerProfile> {
      const id = newUlid();
      const [row] = await executor
        .insert(customerProfiles)
        .values({
          ...data,
          id,
          defaultLocation: data.defaultLocation ?? null,
        })
        .returning();
      if (!row) throw new Error("Insert customer profile returned no row");
      return mapCustomerProfile(row);
    },

    async findCustomerProfileByUserId(userId: UserId): Promise<CustomerProfile | null> {
      const [row] = await executor
        .select()
        .from(customerProfiles)
        .where(eq(customerProfiles.userId, userId))
        .limit(1);
      return row ? mapCustomerProfile(row) : null;
    },

    // ── Vendor profiles ─────────────────────────────────────────────────────

    async insertVendorProfile(data: Omit<NewVendorProfileRow, "id">): Promise<VendorProfile> {
      const id = newUlid();
      const [row] = await executor
        .insert(vendorProfiles)
        .values({ ...data, id })
        .returning();
      if (!row) throw new Error("Insert vendor profile returned no row");
      return mapVendorProfile(row);
    },

    async findVendorProfileByUserId(userId: UserId): Promise<VendorProfile | null> {
      const [row] = await executor
        .select()
        .from(vendorProfiles)
        .where(eq(vendorProfiles.userId, userId))
        .limit(1);
      return row ? mapVendorProfile(row) : null;
    },

    async findVendorProfileBySlug(slug: string): Promise<VendorProfile | null> {
      const [row] = await executor
        .select()
        .from(vendorProfiles)
        .where(eq(vendorProfiles.slug, slug))
        .limit(1);
      return row ? mapVendorProfile(row) : null;
    },

    // ── Vendor members ──────────────────────────────────────────────────────

    async insertVendorMember(data: Omit<NewVendorMemberRow, "id">): Promise<VendorMember> {
      const id = newUlid();
      const [row] = await executor
        .insert(vendorMembers)
        .values({ ...data, id })
        .returning();
      if (!row) throw new Error("Insert vendor member returned no row");
      return mapVendorMember(row);
    },

    async findVendorMembersByVendorId(vendorId: VendorId): Promise<VendorMember[]> {
      const rows = await executor
        .select()
        .from(vendorMembers)
        .where(eq(vendorMembers.vendorId, vendorId));
      return rows.map(mapVendorMember);
    },

    // ── Verifications ───────────────────────────────────────────────────────

    async insertVerification(
      data: Omit<NewVerificationRow, "id" | "metadata"> & {
        metadata?: VerificationMetadata;
      },
    ): Promise<Verification> {
      const id = newUlid();
      const [row] = await executor
        .insert(verifications)
        .values({
          ...data,
          id,
          metadata: data.metadata ?? null,
        })
        .returning();
      if (!row) throw new Error("Insert verification returned no row");
      return mapVerification(row);
    },

    async findVerificationsByVendorId(vendorId: VendorId): Promise<Verification[]> {
      const rows = await executor
        .select()
        .from(verifications)
        .where(eq(verifications.vendorId, vendorId));
      return rows.map(mapVerification);
    },

    // ── Safeguarding reports (append-only) ──────────────────────────────────

    async insertSafeguardingReport(
      data: Omit<NewSafeguardingReportRow, "id">,
    ): Promise<SafeguardingReport> {
      const id = newUlid();
      const [row] = await executor
        .insert(safeguardingReports)
        .values({ ...data, id })
        .returning();
      if (!row) throw new Error("Insert safeguarding report returned no row");
      return mapSafeguardingReport(row);
    },

    async findSafeguardingReportsByBookingId(bookingId: BookingId): Promise<SafeguardingReport[]> {
      const rows = await executor
        .select()
        .from(safeguardingReports)
        .where(eq(safeguardingReports.bookingId, bookingId));
      return rows.map(mapSafeguardingReport);
    },
  };
}

export type IdentityRepository = ReturnType<typeof createIdentityRepository>;
