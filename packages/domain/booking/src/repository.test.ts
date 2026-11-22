import { describe, it, expect } from "vitest";
import {
  CancellationRuleSchema,
  RefundRuleSchema,
  EventDetailsSchema,
  QuoteRequestSchema,
} from "./schema.js";
import { mapBooking, mapPolicyVersion } from "./repository.js";

describe("CancellationRuleSchema", () => {
  it("parses valid cancellation rules", () => {
    const raw = {
      vendorCancelPct: 100,
      customerMoreThan48hPct: 100,
      customer24to48hPct: 50,
      customerLess24hPct: 0,
    };
    const result = CancellationRuleSchema.parse(raw);
    expect(result.vendorCancelPct).toBe(100);
    expect(result.customerLess24hPct).toBe(0);
  });

  it("rejects percentages above 100", () => {
    expect(() =>
      CancellationRuleSchema.parse({
        vendorCancelPct: 101,
        customerMoreThan48hPct: 100,
        customer24to48hPct: 50,
        customerLess24hPct: 0,
      }),
    ).toThrow();
  });
});

describe("RefundRuleSchema", () => {
  it("parses valid refund rule", () => {
    const result = RefundRuleSchema.parse({ noShowRefundPct: 0 });
    expect(result.noShowRefundPct).toBe(0);
  });
});

describe("EventDetailsSchema", () => {
  it("parses partial event details", () => {
    const result = EventDetailsSchema.parse({ guestCount: 50 });
    expect(result.guestCount).toBe(50);
    expect(result.venue).toBeUndefined();
  });

  it("parses empty object (all optional)", () => {
    expect(EventDetailsSchema.parse({})).toEqual({});
  });
});

describe("QuoteRequestSchema", () => {
  it("requires description", () => {
    expect(() => QuoteRequestSchema.parse({})).toThrow();
  });

  it("parses a valid request", () => {
    const result = QuoteRequestSchema.parse({
      description: "Birthday party for 50 guests",
      budget: 100000,
    });
    expect(result.description).toContain("Birthday");
  });
});

describe("Booking mappers", () => {
  it("maps BookingRow integer minor units to Money and validates jsonb eventDetails", () => {
    const now = new Date();
    const booking = mapBooking({
      id: "01J00000000000000000000001",
      customerId: "01J00000000000000000000002",
      vendorId: "01J00000000000000000000003",
      serviceId: "01J00000000000000000000004",
      quoteId: null,
      bookingModel: "instant",
      status: "confirmed",
      scheduledAt: now,
      durationMinutes: 60,
      grossPriceMinor: 5000,
      vendorShareMinor: 4500,
      platformFeeMinor: 500,
      paymentId: "01J00000000000000000000005",
      policyVersionId: "01J00000000000000000000006",
      eventDetails: { guestCount: 25, venue: "Manchester" },
      createdAt: now,
      updatedAt: now,
    });
    expect(booking.grossPrice.amountMinor).toBe(5000);
    expect(booking.vendorShare.amountMinor).toBe(4500);
    expect(booking.platformFee.amountMinor).toBe(500);
    expect(booking.eventDetails?.guestCount).toBe(25);
  });

  it("maps PolicyVersionRow jsonb rules", () => {
    const now = new Date();
    const policy = mapPolicyVersion({
      id: "01J00000000000000000000001",
      version: "2026-11-v1",
      cancellationRules: {
        vendorCancelPct: 100,
        customerMoreThan48hPct: 100,
        customer24to48hPct: 50,
        customerLess24hPct: 0,
      },
      refundRules: { noShowRefundPct: 0 },
      effectiveFrom: now,
      createdAt: now,
    });
    expect(policy.cancellationRules.customer24to48hPct).toBe(50);
    expect(policy.refundRules.noShowRefundPct).toBe(0);
  });
});
