import "server-only";
import { eq } from "drizzle-orm";
import type { DbExecutor } from "@servyn/db";
import { reviews, type ReviewRow, type NewReviewRow } from "@servyn/db";
import {
  asReviewId,
  asBookingId,
  asOrderId,
  asUserId,
  asVendorId,
  newUlid,
  type ReviewId,
  type BookingId,
  type OrderId,
  type UserId,
  type VendorId,
} from "@servyn/core";
import { ReviewModerationStateSchema, type ReviewModerationState, type Rating } from "./schema.js";

export interface Review {
  id: ReviewId;
  bookingId: BookingId | null;
  orderId: OrderId | null;
  customerId: UserId;
  vendorId: VendorId;
  rating: Rating;
  body: string | null;
  moderationState: ReviewModerationState;
  createdAt: Date;
  updatedAt: Date;
}

export function mapReview(row: ReviewRow): Review {
  return {
    id: asReviewId(row.id),
    bookingId:
      row.bookingId !== null && row.bookingId !== undefined ? asBookingId(row.bookingId) : null,
    orderId: row.orderId !== null && row.orderId !== undefined ? asOrderId(row.orderId) : null,
    customerId: asUserId(row.customerId),
    vendorId: asVendorId(row.vendorId),
    rating: row.rating,
    body: row.body ?? null,
    moderationState: ReviewModerationStateSchema.parse(row.moderationState),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createReviewsRepository(executor: DbExecutor) {
  return {
    async insertReview(data: Omit<NewReviewRow, "id">): Promise<Review> {
      const id = newUlid();
      const [row] = await executor
        .insert(reviews)
        .values({ ...data, id })
        .returning();
      if (!row) throw new Error("Insert review returned no row");
      return mapReview(row);
    },

    async findReviewsByVendorId(vendorId: VendorId): Promise<Review[]> {
      const rows = await executor.select().from(reviews).where(eq(reviews.vendorId, vendorId));
      return rows.map(mapReview);
    },

    async findReviewByBookingId(bookingId: BookingId): Promise<Review | null> {
      const [row] = await executor
        .select()
        .from(reviews)
        .where(eq(reviews.bookingId, bookingId))
        .limit(1);
      return row ? mapReview(row) : null;
    },

    async findReviewByOrderId(orderId: OrderId): Promise<Review | null> {
      const [row] = await executor
        .select()
        .from(reviews)
        .where(eq(reviews.orderId, orderId))
        .limit(1);
      return row ? mapReview(row) : null;
    },

    async updateModerationState(id: ReviewId, state: ReviewModerationState): Promise<Review> {
      const [row] = await executor
        .update(reviews)
        .set({ moderationState: state, updatedAt: new Date() })
        .where(eq(reviews.id, id))
        .returning();
      if (!row) throw new Error("Review moderation update returned no row");
      return mapReview(row);
    },
  };
}

export type ReviewsRepository = ReturnType<typeof createReviewsRepository>;
