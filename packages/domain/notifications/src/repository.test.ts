import { describe, it, expect } from "vitest";
import { NotificationChannelSchema, NotificationPayloadSchema } from "./schema.js";

describe("NotificationChannelSchema", () => {
  it("accepts all valid channels", () => {
    for (const c of ["email", "sms", "push", "in_app"] as const) {
      expect(NotificationChannelSchema.parse(c)).toBe(c);
    }
  });
  it("rejects unknown channel", () => {
    expect(() => NotificationChannelSchema.parse("telegram")).toThrow();
  });
});

describe("NotificationPayloadSchema", () => {
  it("parses a full payload", () => {
    const raw = {
      title: "Booking Confirmed",
      body: "Your booking is confirmed.",
      url: "/bookings/123",
    };
    const result = NotificationPayloadSchema.parse(raw);
    expect(result.title).toBe("Booking Confirmed");
  });

  it("parses an empty payload (all optional)", () => {
    expect(NotificationPayloadSchema.parse({})).toEqual({});
  });
});
