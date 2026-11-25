import { describe, it, expect } from "vitest";
import {
  DefaultLocationSchema,
  VerificationMetadataSchema,
  VerificationStateSchema,
} from "./schema.js";
import { mapCustomerProfile, mapVerification } from "./repository.js";

describe("DefaultLocationSchema", () => {
  it("parses a valid default location", () => {
    const raw = { postcode: "M1 1AE", lat: 53.4808, lng: -2.2426 };
    const result = DefaultLocationSchema.parse(raw);
    expect(result.postcode).toBe("M1 1AE");
    expect(result.lat).toBe(53.4808);
    expect(result.lng).toBe(-2.2426);
  });

  it("includes optional label when present", () => {
    const raw = { postcode: "M1 1AE", lat: 53.4808, lng: -2.2426, label: "Home" };
    const result = DefaultLocationSchema.parse(raw);
    expect(result.label).toBe("Home");
  });

  it("rejects when postcode is missing", () => {
    expect(() => DefaultLocationSchema.parse({ lat: 53.4808, lng: -2.2426 })).toThrow();
  });

  it("rejects when lat is not a number", () => {
    expect(() =>
      DefaultLocationSchema.parse({ postcode: "M1 1AE", lat: "NaN", lng: -2.2426 }),
    ).toThrow();
  });
});

describe("VerificationMetadataSchema", () => {
  it("parses empty object (all fields optional)", () => {
    const result = VerificationMetadataSchema.parse({});
    expect(result).toEqual({});
  });

  it("parses with all fields present", () => {
    const raw = {
      issuedBy: "DBS Update Service",
      certificateNumber: "ABC123",
      notes: "Enhanced check",
    };
    const result = VerificationMetadataSchema.parse(raw);
    expect(result.issuedBy).toBe("DBS Update Service");
    expect(result.certificateNumber).toBe("ABC123");
  });

  it("rejects extra unknown fields by passing through (zod strip mode)", () => {
    const result = VerificationMetadataSchema.parse({
      issuedBy: "DBS",
      _internal: "should_be_stripped",
    });
    expect("_internal" in result).toBe(false);
  });
});

describe("VerificationStateSchema", () => {
  it("accepts unverified, pending, verified, rejected, expired", () => {
    for (const state of ["unverified", "pending", "verified", "rejected", "expired"] as const) {
      expect(VerificationStateSchema.parse(state)).toBe(state);
    }
  });
});

describe("Identity mappers", () => {
  it("maps CustomerProfile jsonb defaultLocation", () => {
    const now = new Date();
    const profile = mapCustomerProfile({
      id: "01J00000000000000000000001",
      userId: "01J00000000000000000000002",
      displayName: "Ada",
      defaultLocation: { postcode: "M1 1AE", lat: 53.4808, lng: -2.2426 },
      ageConfirmedAt: null,
      marketingOptIn: false,
      createdAt: now,
      updatedAt: now,
    });
    expect(profile.defaultLocation?.postcode).toBe("M1 1AE");
  });

  it("maps Verification jsonb metadata", () => {
    const now = new Date();
    const verification = mapVerification({
      id: "01J00000000000000000000001",
      vendorId: "01J00000000000000000000002",
      kind: "dbs",
      state: "verified",
      objectKey: "private/dbs/1.pdf",
      expiresOn: null,
      metadata: { issuedBy: "DBS", certificateNumber: "1234" },
      createdAt: now,
      updatedAt: now,
    });
    expect(verification.state).toBe("verified");
    expect(verification.metadata?.certificateNumber).toBe("1234");
  });
});
