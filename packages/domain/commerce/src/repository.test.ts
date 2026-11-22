import { describe, it, expect } from "vitest";
import { OrderStatusSchema, DeliveryDetailsSchema, BulkEnquiryRequestSchema } from "./schema.js";

describe("OrderStatusSchema", () => {
  it("accepts all valid statuses", () => {
    for (const s of [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "completed",
      "cancelled",
      "refunded",
    ] as const) {
      expect(OrderStatusSchema.parse(s)).toBe(s);
    }
  });
  it("rejects unknown status", () => {
    expect(() => OrderStatusSchema.parse("dispatched")).toThrow();
  });
});

describe("DeliveryDetailsSchema", () => {
  it("parses a valid delivery address", () => {
    const raw = {
      fullName: "Adeola Johnson",
      addressLine1: "10 Piccadilly",
      city: "Manchester",
      postcode: "M1 1AE",
    };
    const result = DeliveryDetailsSchema.parse(raw);
    expect(result.fullName).toBe("Adeola Johnson");
    expect(result.country).toBe("GB");
  });

  it("rejects when fullName is missing", () => {
    expect(() =>
      DeliveryDetailsSchema.parse({
        addressLine1: "10 Piccadilly",
        city: "Manchester",
        postcode: "M1 1AE",
      }),
    ).toThrow();
  });
});

describe("BulkEnquiryRequestSchema", () => {
  it("parses a valid request", () => {
    const result = BulkEnquiryRequestSchema.parse({ quantity: 100, notes: "Urgent" });
    expect(result.quantity).toBe(100);
  });
  it("rejects quantity 0", () => {
    expect(() => BulkEnquiryRequestSchema.parse({ quantity: 0 })).toThrow();
  });
});
