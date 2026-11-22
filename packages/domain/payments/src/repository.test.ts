import { describe, it, expect } from "vitest";
import {
  PaymentStateSchema,
  ReleaseBasisSchema,
  RefundReasonSchema,
  FeeWaiverKindSchema,
} from "./schema.js";

describe("PaymentStateSchema", () => {
  const validStates = [
    "requires_payment",
    "processing",
    "held",
    "releasable",
    "released",
    "refund_pending",
    "refunded",
    "disputed",
    "under_review",
    "error",
  ] as const;

  it.each(validStates)("accepts state %s", (state) => {
    expect(PaymentStateSchema.parse(state)).toBe(state);
  });

  it("rejects unknown state", () => {
    expect(() => PaymentStateSchema.parse("paid")).toThrow();
  });
});

describe("ReleaseBasisSchema", () => {
  it("accepts completion_confirm", () => {
    expect(ReleaseBasisSchema.parse("completion_confirm")).toBe("completion_confirm");
  });

  it("accepts auto_48h", () => {
    expect(ReleaseBasisSchema.parse("auto_48h")).toBe("auto_48h");
  });

  it("rejects unknown basis", () => {
    expect(() => ReleaseBasisSchema.parse("manual")).toThrow();
  });
});

describe("RefundReasonSchema", () => {
  it("accepts all valid reasons", () => {
    for (const r of ["vendor_cancel", "customer_cancel", "dispute_resolved", "admin"] as const) {
      expect(RefundReasonSchema.parse(r)).toBe(r);
    }
  });
});

describe("FeeWaiverKindSchema", () => {
  it("accepts early_adopter and promo", () => {
    expect(FeeWaiverKindSchema.parse("early_adopter")).toBe("early_adopter");
    expect(FeeWaiverKindSchema.parse("promo")).toBe("promo");
  });
});
