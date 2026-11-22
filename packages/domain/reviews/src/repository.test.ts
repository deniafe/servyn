import { describe, it, expect } from "vitest";
import { ReviewModerationStateSchema, RatingSchema } from "./schema.js";
import { mapReview } from "./repository.js";

describe("ReviewModerationStateSchema", () => {
  it("accepts pending, published, hidden", () => {
    for (const s of ["pending", "published", "hidden"] as const) {
      expect(ReviewModerationStateSchema.parse(s)).toBe(s);
    }
  });
  it("rejects unknown state", () => {
    expect(() => ReviewModerationStateSchema.parse("rejected")).toThrow();
    expect(() => ReviewModerationStateSchema.parse("approved")).toThrow();
  });
});

describe("RatingSchema", () => {
  it("accepts 1–5", () => {
    for (const r of [1, 2, 3, 4, 5]) {
      expect(RatingSchema.parse(r)).toBe(r);
    }
  });
  it("rejects 0", () => {
    expect(() => RatingSchema.parse(0)).toThrow();
  });
  it("rejects 6", () => {
    expect(() => RatingSchema.parse(6)).toThrow();
  });
});

describe("mapReview", () => {
  it("maps booking-scoped and order-scoped rows with branded IDs", () => {
    const now = new Date();
    const mapped = mapReview({
      id: "01J00000000000000000000001",
      bookingId: "01J00000000000000000000002",
      orderId: null,
      customerId: "01J00000000000000000000003",
      vendorId: "01J00000000000000000000004",
      rating: 5,
      body: "Great service",
      moderationState: "published",
      createdAt: now,
      updatedAt: now,
    });
    expect(mapped.bookingId).toBe("01J00000000000000000000002");
    expect(mapped.orderId).toBeNull();
    expect(mapped.moderationState).toBe("published");
  });
});
