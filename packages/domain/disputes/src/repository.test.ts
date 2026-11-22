import { describe, it, expect } from "vitest";
import { DisputeReasonSchema, DisputeStateSchema, EvidenceKindSchema } from "./schema.js";

describe("DisputeReasonSchema", () => {
  it("accepts all valid reasons", () => {
    for (const r of [
      "service_not_delivered",
      "quality_issue",
      "no_show",
      "unauthorised_charge",
      "other",
    ] as const) {
      expect(DisputeReasonSchema.parse(r)).toBe(r);
    }
  });
  it("rejects unknown reason", () => {
    expect(() => DisputeReasonSchema.parse("fraud")).toThrow();
  });
});

describe("DisputeStateSchema", () => {
  it("accepts all valid states", () => {
    for (const s of [
      "open",
      "under_review",
      "resolved_customer",
      "resolved_vendor",
      "closed",
    ] as const) {
      expect(DisputeStateSchema.parse(s)).toBe(s);
    }
  });
});

describe("EvidenceKindSchema", () => {
  it("accepts image, document, text, video", () => {
    for (const k of ["image", "document", "text", "video"] as const) {
      expect(EvidenceKindSchema.parse(k)).toBe(k);
    }
  });
});
