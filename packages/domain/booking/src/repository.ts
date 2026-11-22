import "server-only";
import { desc, eq } from "drizzle-orm";
import type { DbExecutor } from "@servyn/db";
import {
  bookings,
  bookingEvents,
  quotes,
  policyVersions,
  availabilityRules,
  availabilityExceptions,
  favourites,
  type BookingRow,
  type NewBookingRow,
  type BookingEventRow,
  type NewBookingEventRow,
  type QuoteRow,
  type NewQuoteRow,
  type PolicyVersionRow,
  type NewPolicyVersionRow,
  type FavouriteRow,
  type NewFavouriteRow,
} from "@servyn/db";
import {
  asBookingId,
  asBookingEventId,
  asQuoteId,
  asPolicyVersionId,
  asFavouriteId,
  asServiceId,
  asPaymentId,
  asUserId,
  asVendorId,
  newUlid,
  money,
  type BookingId,
  type BookingEventId,
  type QuoteId,
  type PolicyVersionId,
  type FavouriteId,
  type ServiceId,
  type PaymentId,
  type UserId,
  type VendorId,
  type Money,
} from "@servyn/core";
import {
  EventDetailsSchema,
  QuoteRequestSchema,
  QuoteLinesSchema,
  CancellationRuleSchema,
  RefundRuleSchema,
  BookingEventMetadataSchema,
  type EventDetails,
  type QuoteRequest,
  type QuoteLines,
  type CancellationRule,
  type RefundRule,
  type BookingEventMetadata,
  type BookingStatus,
} from "./schema.js";

// ── Domain types ──────────────────────────────────────────────────────────────

export interface Booking {
  id: BookingId;
  customerId: UserId;
  vendorId: VendorId;
  serviceId: ServiceId;
  quoteId: QuoteId | null;
  bookingModel: "request" | "instant" | "quote";
  status: BookingStatus;
  scheduledAt: Date;
  durationMinutes: number;
  grossPrice: Money;
  vendorShare: Money;
  platformFee: Money;
  paymentId: PaymentId | null;
  policyVersionId: PolicyVersionId;
  eventDetails: EventDetails | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingEvent {
  id: BookingEventId;
  bookingId: BookingId;
  status: BookingStatus;
  actorId: UserId;
  at: number; // epoch-ms
  metadata: BookingEventMetadata | null;
}

export interface Quote {
  id: QuoteId;
  customerId: UserId;
  vendorId: VendorId;
  state: "requested" | "quoted" | "accepted" | "declined";
  request: QuoteRequest;
  quoteLines: QuoteLines | null;
  total: Money | null;
  bookingId: BookingId | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyVersion {
  id: PolicyVersionId;
  version: string;
  cancellationRules: CancellationRule;
  refundRules: RefundRule;
  effectiveFrom: Date;
  createdAt: Date;
}

export interface Favourite {
  id: FavouriteId;
  customerId: UserId;
  vendorId: VendorId;
  createdAt: Date;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

export function mapBooking(row: BookingRow): Booking {
  return {
    id: asBookingId(row.id),
    customerId: asUserId(row.customerId),
    vendorId: asVendorId(row.vendorId),
    serviceId: asServiceId(row.serviceId),
    quoteId: row.quoteId !== null && row.quoteId !== undefined ? asQuoteId(row.quoteId) : null,
    bookingModel: row.bookingModel,
    status: row.status,
    scheduledAt: row.scheduledAt,
    durationMinutes: row.durationMinutes,
    grossPrice: money(row.grossPriceMinor),
    vendorShare: money(row.vendorShareMinor),
    platformFee: money(row.platformFeeMinor),
    paymentId:
      row.paymentId !== null && row.paymentId !== undefined ? asPaymentId(row.paymentId) : null,
    policyVersionId: asPolicyVersionId(row.policyVersionId),
    eventDetails:
      row.eventDetails !== null && row.eventDetails !== undefined
        ? EventDetailsSchema.parse(row.eventDetails)
        : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapBookingEvent(row: BookingEventRow): BookingEvent {
  return {
    id: asBookingEventId(row.id),
    bookingId: asBookingId(row.bookingId),
    status: row.status,
    actorId: asUserId(row.actorId),
    at: row.at,
    metadata:
      row.metadata !== null && row.metadata !== undefined
        ? BookingEventMetadataSchema.parse(row.metadata)
        : null,
  };
}

export function mapQuote(row: QuoteRow): Quote {
  return {
    id: asQuoteId(row.id),
    customerId: asUserId(row.customerId),
    vendorId: asVendorId(row.vendorId),
    state: row.state,
    request: QuoteRequestSchema.parse(row.request),
    quoteLines:
      row.quoteLines !== null && row.quoteLines !== undefined
        ? QuoteLinesSchema.parse(row.quoteLines)
        : null,
    total: row.totalMinor !== null && row.totalMinor !== undefined ? money(row.totalMinor) : null,
    bookingId:
      row.bookingId !== null && row.bookingId !== undefined ? asBookingId(row.bookingId) : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapPolicyVersion(row: PolicyVersionRow): PolicyVersion {
  return {
    id: asPolicyVersionId(row.id),
    version: row.version,
    cancellationRules: CancellationRuleSchema.parse(row.cancellationRules),
    refundRules: RefundRuleSchema.parse(row.refundRules),
    effectiveFrom: row.effectiveFrom,
    createdAt: row.createdAt,
  };
}

export function mapFavourite(row: FavouriteRow): Favourite {
  return {
    id: asFavouriteId(row.id),
    customerId: asUserId(row.customerId),
    vendorId: asVendorId(row.vendorId),
    createdAt: row.createdAt,
  };
}

// ── Repository factory ────────────────────────────────────────────────────────

export function createBookingRepository(executor: DbExecutor) {
  return {
    // ── Bookings ────────────────────────────────────────────────────────────

    async insertBooking(
      data: Omit<
        NewBookingRow,
        "id" | "grossPriceMinor" | "vendorShareMinor" | "platformFeeMinor" | "eventDetails"
      > & {
        grossPrice: Money;
        vendorShare: Money;
        platformFee: Money;
        eventDetails?: EventDetails;
      },
    ): Promise<Booking> {
      const id = newUlid();
      const [row] = await executor
        .insert(bookings)
        .values({
          ...data,
          id,
          grossPriceMinor: data.grossPrice.amountMinor,
          vendorShareMinor: data.vendorShare.amountMinor,
          platformFeeMinor: data.platformFee.amountMinor,
          eventDetails: data.eventDetails ?? null,
        })
        .returning();
      if (!row) throw new Error("Insert booking returned no row");
      return mapBooking(row);
    },

    async findBookingById(id: BookingId): Promise<Booking | null> {
      const [row] = await executor.select().from(bookings).where(eq(bookings.id, id)).limit(1);
      return row ? mapBooking(row) : null;
    },

    async findBookingsByCustomerId(customerId: UserId): Promise<Booking[]> {
      const rows = await executor
        .select()
        .from(bookings)
        .where(eq(bookings.customerId, customerId));
      return rows.map(mapBooking);
    },

    async findBookingsByVendorId(vendorId: VendorId): Promise<Booking[]> {
      const rows = await executor.select().from(bookings).where(eq(bookings.vendorId, vendorId));
      return rows.map(mapBooking);
    },

    // ── BookingEvents (append-only) ─────────────────────────────────────────

    async insertBookingEvent(
      data: Omit<NewBookingEventRow, "id" | "metadata"> & {
        metadata?: BookingEventMetadata;
      },
    ): Promise<BookingEvent> {
      const id = newUlid();
      const [row] = await executor
        .insert(bookingEvents)
        .values({
          ...data,
          id,
          metadata: data.metadata ?? null,
        })
        .returning();
      if (!row) throw new Error("Insert booking event returned no row");
      return mapBookingEvent(row);
    },

    async findBookingEventsByBookingId(bookingId: BookingId): Promise<BookingEvent[]> {
      const rows = await executor
        .select()
        .from(bookingEvents)
        .where(eq(bookingEvents.bookingId, bookingId));
      return rows.map(mapBookingEvent);
    },

    // ── Quotes ──────────────────────────────────────────────────────────────

    async insertQuote(
      data: Omit<NewQuoteRow, "id" | "request" | "quoteLines"> & {
        request: QuoteRequest;
        quoteLines?: QuoteLines;
      },
    ): Promise<Quote> {
      const id = newUlid();
      const [row] = await executor
        .insert(quotes)
        .values({
          ...data,
          id,
          request: data.request,
          quoteLines: data.quoteLines ?? null,
        })
        .returning();
      if (!row) throw new Error("Insert quote returned no row");
      return mapQuote(row);
    },

    async findQuoteById(id: QuoteId): Promise<Quote | null> {
      const [row] = await executor.select().from(quotes).where(eq(quotes.id, id)).limit(1);
      return row ? mapQuote(row) : null;
    },

    // ── PolicyVersions (append-only) ────────────────────────────────────────

    async insertPolicyVersion(
      data: Omit<NewPolicyVersionRow, "id" | "cancellationRules" | "refundRules"> & {
        cancellationRules: CancellationRule;
        refundRules: RefundRule;
      },
    ): Promise<PolicyVersion> {
      const id = newUlid();
      const [row] = await executor
        .insert(policyVersions)
        .values({
          ...data,
          id,
          cancellationRules: data.cancellationRules,
          refundRules: data.refundRules,
        })
        .returning();
      if (!row) throw new Error("Insert policy version returned no row");
      return mapPolicyVersion(row);
    },

    async findLatestPolicyVersion(): Promise<PolicyVersion | null> {
      const rows = await executor
        .select()
        .from(policyVersions)
        .orderBy(desc(policyVersions.effectiveFrom))
        .limit(1);
      return rows[0] ? mapPolicyVersion(rows[0]) : null;
    },

    // ── Favourites ──────────────────────────────────────────────────────────

    async insertFavourite(data: Omit<NewFavouriteRow, "id">): Promise<Favourite> {
      const id = newUlid();
      const [row] = await executor
        .insert(favourites)
        .values({ ...data, id })
        .returning();
      if (!row) throw new Error("Insert favourite returned no row");
      return mapFavourite(row);
    },

    async findFavouritesByCustomerId(customerId: UserId): Promise<Favourite[]> {
      const rows = await executor
        .select()
        .from(favourites)
        .where(eq(favourites.customerId, customerId));
      return rows.map(mapFavourite);
    },

    async deleteFavourite(id: FavouriteId): Promise<void> {
      await executor.delete(favourites).where(eq(favourites.id, id));
    },
  };
}

export type BookingRepository = ReturnType<typeof createBookingRepository>;

// ── Availability rule/exception tables are owned by this domain ──────────────
// Their slot-computation queries are deferred to U11 (Availability Engine).
// The tables are exported from @servyn/db for direct use in U11.
export { availabilityRules, availabilityExceptions };
