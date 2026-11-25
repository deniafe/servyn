import { describe, it, expect } from "vitest";
import { asCustomerId, asUserId, asVendorId } from "@servyn/core";
import { ClerkWebhookEventSchema } from "./schema.js";
import {
  authorizeRole,
  extractDisplayName,
  extractPrimaryEmail,
  isSafeRelativePath,
  processClerkWebhookEvent,
  resolveRoles,
  updateConsentPreferences,
  type ResolvedIdentity,
} from "./service.js";
import type { CustomerProfile, User, VendorProfile } from "./repository.js";

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: asUserId("01ARZ3NDEKTSV4RRFFQ69G5FAV"),
    clerkUserId: "user_123",
    email: "ada@example.com",
    phone: null,
    status: "active",
    isAdmin: false,
    consentPreferences: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeCustomer(userId = asUserId("01ARZ3NDEKTSV4RRFFQ69G5FAV")): CustomerProfile {
  return {
    id: asCustomerId("01ARZ3NDEKTSV4RRFFQ69G5FAW"),
    userId,
    displayName: "Ada Okafor",
    defaultLocation: null,
    ageConfirmedAt: null,
    marketingOptIn: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeVendor(overrides: Partial<VendorProfile> = {}): VendorProfile {
  return {
    id: asVendorId("01ARZ3NDEKTSV4RRFFQ69G5FAX"),
    userId: asUserId("01ARZ3NDEKTSV4RRFFQ69G5FAV"),
    businessName: "Ada Braids",
    slug: "ada-braids",
    description: null,
    serviceArea: null,
    stripeAccountId: null,
    isSeller: false,
    verificationStatus: "unverified",
    ratingAvg: 0,
    ratingCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("ClerkWebhookEventSchema", () => {
  it("parses user.created, user.updated, and user.deleted events", () => {
    const created = ClerkWebhookEventSchema.parse({
      type: "user.created",
      data: {
        id: "user_123",
        first_name: "Ada",
        last_name: "Okafor",
        primary_email_address_id: "idn_1",
        email_addresses: [{ id: "idn_1", email_address: "ada@example.com" }],
        phone_numbers: [],
      },
    });
    expect(created.type).toBe("user.created");
    if (created.type === "user.created") {
      expect(extractPrimaryEmail(created.data)).toBe("ada@example.com");
      expect(extractDisplayName(created.data)).toBe("Ada Okafor");
    }

    const deleted = ClerkWebhookEventSchema.parse({
      type: "user.deleted",
      data: { id: "user_123", deleted: true },
    });
    expect(deleted.type).toBe("user.deleted");
  });

  it("rejects unsupported event types", () => {
    expect(() =>
      ClerkWebhookEventSchema.parse({ type: "session.created", data: { id: "sess_1" } }),
    ).toThrow();
  });
});

describe("resolveRoles", () => {
  it("returns customer-only for active users without vendor profile", () => {
    const user = makeUser();
    expect(resolveRoles(user, makeCustomer(), null)).toEqual(["customer"]);
  });

  it("returns customer + vendor + seller when vendor has isSeller=true", () => {
    const user = makeUser();
    expect(resolveRoles(user, makeCustomer(), makeVendor({ isSeller: true }))).toEqual([
      "customer",
      "vendor",
      "seller",
    ]);
  });

  it("includes admin when user.isAdmin is true", () => {
    const user = makeUser({ isAdmin: true });
    expect(resolveRoles(user, makeCustomer(), null)).toEqual(["customer", "admin"]);
  });
});

describe("authorizeRole", () => {
  const baseIdentity = (overrides: Partial<ResolvedIdentity> = {}): ResolvedIdentity => {
    const user = overrides.user ?? makeUser();
    const customerProfile = overrides.customerProfile ?? makeCustomer();
    const vendorProfile = overrides.vendorProfile ?? null;
    const roles = overrides.roles ?? resolveRoles(user, customerProfile, vendorProfile);
    return { user, customerProfile, vendorProfile, roles };
  };

  it("redirects suspended or deleted users to /suspended", () => {
    const res = authorizeRole(
      baseIdentity({ user: makeUser({ status: "suspended" }) }),
      "customer",
      {
        requireMfa: false,
        hasMfa: false,
      },
    );
    expect(res).toEqual({
      allowed: false,
      reason: "suspended",
      redirectTo: "/suspended",
      httpStatus: 307,
    });
  });

  it("redirects customer missing vendor role to /onboarding?intent=vendor", () => {
    const res = authorizeRole(baseIdentity(), "vendor", {
      requireMfa: true,
      hasMfa: true,
    });
    expect(res).toEqual({
      allowed: false,
      reason: "missing_role",
      redirectTo: "/onboarding?intent=vendor",
      httpStatus: 307,
    });
  });

  it("returns 403 forbidden when non-admin hits admin", () => {
    const res = authorizeRole(baseIdentity(), "admin", {
      requireMfa: true,
      hasMfa: true,
    });
    expect(res).toEqual({
      allowed: false,
      reason: "forbidden",
      httpStatus: 403,
    });
  });

  it("redirects vendor without MFA to /mfa-required?redirect_url=%2Fvendor", () => {
    const res = authorizeRole(baseIdentity({ vendorProfile: makeVendor() }), "vendor", {
      requireMfa: true,
      hasMfa: false,
      returnTo: "/vendor",
    });
    expect(res).toEqual({
      allowed: false,
      reason: "mfa_required",
      redirectTo: "/mfa-required?redirect_url=%2Fvendor",
      httpStatus: 307,
    });
  });

  it("allows vendor with verified MFA", () => {
    const res = authorizeRole(baseIdentity({ vendorProfile: makeVendor() }), "vendor", {
      requireMfa: true,
      hasMfa: true,
      returnTo: "/vendor",
    });
    expect(res).toEqual({ allowed: true });
  });
});

describe("isSafeRelativePath", () => {
  it("accepts clean relative paths and rejects protocol-relative or external URLs", () => {
    expect(isSafeRelativePath("/vendor")).toBe(true);
    expect(isSafeRelativePath("/seller/orders?tab=1")).toBe(true);
    expect(isSafeRelativePath("//evil.com")).toBe(false);
    expect(isSafeRelativePath("/\\evil.com")).toBe(false);
    expect(isSafeRelativePath("https://evil.com")).toBe(false);
    expect(isSafeRelativePath(undefined)).toBe(false);
  });
});

describe("processClerkWebhookEvent", () => {
  it("short-circuits deduplicated events without calling sync", async () => {
    let upsertCalls = 0;
    const res = await processClerkWebhookEvent(
      {
        identityRepo: {
          upsertUserByClerkId: () => {
            upsertCalls += 1;
            return Promise.resolve(makeUser());
          },
          ensureCustomerProfile: () => Promise.resolve(makeCustomer()),
          findVendorProfileByUserId: () => Promise.resolve(null),
          markUserDeletedByClerkId: () => Promise.resolve(makeUser()),
        },
        upsertWebhookEvent: () =>
          Promise.resolve({
            event: { id: "evt_1" },
            alreadyProcessed: true,
          }),
        updateWebhookEventState: () => Promise.resolve(),
      },
      {
        type: "user.created",
        data: {
          id: "user_123",
          email_addresses: [{ id: "id_1", email_address: "ada@example.com" }],
          phone_numbers: [],
        },
      },
      "svix_1",
    );

    expect(res).toEqual({ ok: true, deduplicated: true });
    expect(upsertCalls).toBe(0);
  });

  it("syncs user.created and marks webhook_events processed", async () => {
    const states: string[] = [];
    const res = await processClerkWebhookEvent(
      {
        identityRepo: {
          upsertUserByClerkId: () => Promise.resolve(makeUser()),
          ensureCustomerProfile: () => Promise.resolve(makeCustomer()),
          findVendorProfileByUserId: () => Promise.resolve(null),
          markUserDeletedByClerkId: () => Promise.resolve(makeUser()),
        },
        upsertWebhookEvent: () =>
          Promise.resolve({
            event: { id: "evt_2" },
            alreadyProcessed: false,
          }),
        updateWebhookEventState: (_id, state) => {
          states.push(state);
          return Promise.resolve();
        },
      },
      {
        type: "user.created",
        data: {
          id: "user_123",
          first_name: "Ada",
          email_addresses: [{ id: "id_1", email_address: "ada@example.com" }],
          phone_numbers: [],
        },
      },
      "svix_2",
    );

    expect(res).toEqual({ ok: true });
    expect(states).toEqual(["processed"]);
  });

  it("soft-deletes on user.deleted and marks processed", async () => {
    let deletedClerkId: string | null = null;
    const states: string[] = [];
    const res = await processClerkWebhookEvent(
      {
        identityRepo: {
          upsertUserByClerkId: () => Promise.resolve(makeUser()),
          ensureCustomerProfile: () => Promise.resolve(makeCustomer()),
          findVendorProfileByUserId: () => Promise.resolve(null),
          markUserDeletedByClerkId: (clerkId) => {
            deletedClerkId = clerkId;
            return Promise.resolve(makeUser({ status: "deleted" }));
          },
        },
        upsertWebhookEvent: () =>
          Promise.resolve({
            event: { id: "evt_3" },
            alreadyProcessed: false,
          }),
        updateWebhookEventState: (_id, state) => {
          states.push(state);
          return Promise.resolve();
        },
      },
      { type: "user.deleted", data: { id: "user_del_1", deleted: true } },
      "svix_3",
    );

    expect(res).toEqual({ ok: true });
    expect(deletedClerkId).toBe("user_del_1");
    expect(states).toEqual(["processed"]);
  });

  it("marks failed and returns ok:false when user.created has no email", async () => {
    const states: string[] = [];
    const res = await processClerkWebhookEvent(
      {
        identityRepo: {
          upsertUserByClerkId: () => Promise.resolve(makeUser()),
          ensureCustomerProfile: () => Promise.resolve(makeCustomer()),
          findVendorProfileByUserId: () => Promise.resolve(null),
          markUserDeletedByClerkId: () => Promise.resolve(makeUser()),
        },
        upsertWebhookEvent: () =>
          Promise.resolve({
            event: { id: "evt_4" },
            alreadyProcessed: false,
          }),
        updateWebhookEventState: (_id, state) => {
          states.push(state);
          return Promise.resolve();
        },
      },
      {
        type: "user.created",
        data: { id: "user_no_email", email_addresses: [], phone_numbers: [] },
      },
      "svix_4",
    );

    expect(res).toEqual({ ok: false });
    expect(states).toEqual(["failed"]);
  });
});

describe("updateConsentPreferences", () => {
  it("constructs versioned ConsentPreferences with essential=true and persists it", async () => {
    let saved: unknown = null;
    const userId = asUserId("01ARZ3NDEKTSV4RRFFQ69G5FAV");
    const prefs = await updateConsentPreferences(
      {
        updateUserConsentPreferences: (_id, consent) => {
          saved = consent;
          return Promise.resolve(makeUser({ consentPreferences: consent }));
        },
      },
      userId,
      { analytics: true, marketing: false },
    );

    expect(prefs.essential).toBe(true);
    expect(prefs.analytics).toBe(true);
    expect(prefs.marketing).toBe(false);
    expect(prefs.version).toBe(1);
    expect(Number.isNaN(Date.parse(prefs.updatedAt))).toBe(false);
    expect(saved).toEqual(prefs);
  });
});
