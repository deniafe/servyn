import "server-only";
import { asUserId, type UserId } from "@servyn/core";
import type { CustomerProfile, IdentityRepository, User, VendorProfile } from "./repository";
import type { ClerkUserPayload, ClerkWebhookEvent, ConsentPreferences, RoleContext } from "./schema";

export interface ResolvedIdentity {
  user: User;
  customerProfile: CustomerProfile | null;
  vendorProfile: VendorProfile | null;
  roles: RoleContext[];
}

export type AuthzDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason: "suspended" | "mfa_required" | "missing_role" | "forbidden";
      redirectTo?: string;
      httpStatus: 403 | 307;
    };

/**
 * Derive the role contexts held by a single Servyn account.
 * Every active account has `customer`; `vendor` comes from `vendor_profiles`;
 * `seller` comes from `vendor_profiles.is_seller`; `admin` comes from `users.is_admin`.
 */
export function resolveRoles(
  user: Pick<User, "status" | "isAdmin">,
  customerProfile: Pick<CustomerProfile, "id"> | null,
  vendorProfile: Pick<VendorProfile, "id" | "isSeller"> | null,
): RoleContext[] {
  const roles: RoleContext[] = [];
  if (customerProfile !== null || user.status === "active") {
    roles.push("customer");
  }
  if (vendorProfile !== null) {
    roles.push("vendor");
    if (vendorProfile.isSeller) {
      roles.push("seller");
    }
  }
  if (user.isAdmin) {
    roles.push("admin");
  }
  return roles;
}

/**
 * Pure per-request authoriser used by route-group layouts and API handlers.
 */
export function authorizeRole(
  identity: ResolvedIdentity,
  requiredRole: RoleContext,
  options: {
    requireMfa: boolean;
    hasMfa: boolean;
    returnTo?: string;
  },
): AuthzDecision {
  if (identity.user.status !== "active") {
    return {
      allowed: false,
      reason: "suspended",
      redirectTo: "/suspended",
      httpStatus: 307,
    };
  }

  if (!identity.roles.includes(requiredRole)) {
    if (requiredRole === "vendor" || requiredRole === "seller") {
      return {
        allowed: false,
        reason: "missing_role",
        redirectTo: `/onboarding?intent=${requiredRole}`,
        httpStatus: 307,
      };
    }
    return {
      allowed: false,
      reason: "forbidden",
      httpStatus: 403,
    };
  }

  if (options.requireMfa && !options.hasMfa) {
    const query = options.returnTo ? `?redirect_url=${encodeURIComponent(options.returnTo)}` : "";
    return {
      allowed: false,
      reason: "mfa_required",
      redirectTo: `/mfa-required${query}`,
      httpStatus: 307,
    };
  }

  return { allowed: true };
}

export function extractPrimaryEmail(payload: ClerkUserPayload): string | null {
  if (payload.primary_email_address_id) {
    const primary = payload.email_addresses.find((e) => e.id === payload.primary_email_address_id);
    if (primary) return primary.email_address;
  }
  return payload.email_addresses[0]?.email_address ?? null;
}

export function extractPrimaryPhone(payload: ClerkUserPayload): string | null {
  if (payload.primary_phone_number_id) {
    const primary = payload.phone_numbers.find((p) => p.id === payload.primary_phone_number_id);
    if (primary) return primary.phone_number;
  }
  return payload.phone_numbers[0]?.phone_number ?? null;
}

export function extractDisplayName(payload: ClerkUserPayload): string {
  const full = [payload.first_name, payload.last_name]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join(" ")
    .trim();
  if (full.length > 0) return full;
  if (payload.username && payload.username.trim().length > 0) return payload.username.trim();
  const email = extractPrimaryEmail(payload);
  if (email) {
    const local = email.split("@")[0];
    if (local && local.length > 0) return local;
  }
  return "Servyn Member";
}

/**
 * Shared idempotent Clerk -> Neon user sync used by both `/api/webhooks/clerk`
 * and the JIT fallback in `getCurrentIdentity()`.
 */
export async function syncClerkUser(
  repo: IdentityRepository,
  input: {
    clerkUserId: string;
    email: string;
    phone: string | null;
    displayName: string;
  },
): Promise<ResolvedIdentity> {
  const user = await repo.upsertUserByClerkId({
    clerkUserId: input.clerkUserId,
    email: input.email,
    phone: input.phone,
  });

  const customerProfile = await repo.ensureCustomerProfile(asUserId(user.id), input.displayName);
  const vendorProfile = await repo.findVendorProfileByUserId(asUserId(user.id));

  return {
    user,
    customerProfile,
    vendorProfile,
    roles: resolveRoles(user, customerProfile, vendorProfile),
  };
}

export async function markClerkUserDeleted(
  repo: IdentityRepository,
  clerkUserId: string,
): Promise<User | null> {
  return repo.markUserDeletedByClerkId(clerkUserId);
}

export async function updateConsentPreferences(
  repo: Pick<IdentityRepository, "updateUserConsentPreferences">,
  userId: UserId,
  input: { analytics: boolean; marketing: boolean },
): Promise<ConsentPreferences> {
  const prefs: ConsentPreferences = {
    essential: true,
    analytics: input.analytics,
    marketing: input.marketing,
    updatedAt: new Date().toISOString(),
    version: 1,
  };
  await repo.updateUserConsentPreferences(userId, prefs);
  return prefs;
}

function slugifyBusinessName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return base.length >= 2 ? base : "servyn-provider";
}

export async function becomeVendor(
  repo: IdentityRepository,
  userId: UserId,
  input: {
    businessName: string;
    slug?: string;
    description?: string | null;
    isSeller?: boolean;
  },
): Promise<VendorProfile> {
  const existing = await repo.findVendorProfileByUserId(userId);
  if (existing) {
    if (input.isSeller && !existing.isSeller) {
      return repo.enableSellerOnVendorProfile(userId);
    }
    return existing;
  }

  const baseSlug = input.slug ?? slugifyBusinessName(input.businessName);
  const existingSlug = await repo.findVendorProfileBySlug(baseSlug);
  const uniqueSlug = existingSlug ? `${baseSlug}-${userId.slice(-6).toLowerCase()}` : baseSlug;

  return repo.insertVendorProfile({
    userId,
    businessName: input.businessName,
    slug: uniqueSlug,
    description: input.description ?? null,
    isSeller: input.isSeller ?? false,
    verificationStatus: "unverified",
  });
}

export async function becomeSeller(
  repo: IdentityRepository,
  userId: UserId,
  input: {
    businessName: string;
    description?: string | null;
  },
): Promise<VendorProfile> {
  return becomeVendor(repo, userId, {
    businessName: input.businessName,
    description: input.description ?? null,
    isSeller: true,
  });
}

/**
 * Validates that a redirect target is a strictly relative same-origin path
 * (rejects protocol-relative `//`, backslash `/\`, or absolute URLs).
 */
export function isSafeRelativePath(candidate: string | undefined | null): candidate is string {
  if (!candidate) return false;
  if (!candidate.startsWith("/")) return false;
  if (candidate.startsWith("//") || candidate.startsWith("/\\")) return false;
  return true;
}

export interface ClerkWebhookDispatchDeps {
  identityRepo: Pick<
    IdentityRepository,
    | "upsertUserByClerkId"
    | "ensureCustomerProfile"
    | "findVendorProfileByUserId"
    | "markUserDeletedByClerkId"
  >;
  upsertWebhookEvent: (input: {
    provider: "clerk";
    eventId: string;
    type: string;
    state: "processing";
    payload: unknown;
  }) => Promise<{ event: { id: string }; alreadyProcessed: boolean }>;
  updateWebhookEventState: (
    id: string,
    state: "processed" | "failed",
    processedAt?: Date,
  ) => Promise<void>;
}

export async function processClerkWebhookEvent(
  deps: ClerkWebhookDispatchDeps,
  evt: ClerkWebhookEvent,
  svixId: string,
): Promise<{ ok: true; deduplicated?: boolean } | { ok: false }> {
  const { event, alreadyProcessed } = await deps.upsertWebhookEvent({
    provider: "clerk",
    eventId: svixId,
    type: evt.type,
    state: "processing",
    payload: evt,
  });

  if (alreadyProcessed) {
    return { ok: true, deduplicated: true };
  }

  try {
    if (evt.type === "user.created" || evt.type === "user.updated") {
      const email = extractPrimaryEmail(evt.data);
      if (!email) {
        throw new Error(`Clerk user ${evt.data.id} has no email address`);
      }
      await syncClerkUser(deps.identityRepo as IdentityRepository, {
        clerkUserId: evt.data.id,
        email,
        phone: extractPrimaryPhone(evt.data),
        displayName: extractDisplayName(evt.data),
      });
    } else if (evt.type === "user.deleted") {
      await markClerkUserDeleted(deps.identityRepo as IdentityRepository, evt.data.id);
    }

    await deps.updateWebhookEventState(event.id, "processed", new Date());
    return { ok: true };
  } catch {
    await deps.updateWebhookEventState(event.id, "failed");
    return { ok: false };
  }
}
