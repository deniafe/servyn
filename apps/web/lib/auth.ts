import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getDb } from "@servyn/db";
import {
  authorizeRole,
  createIdentityRepository,
  resolveRoles,
  syncClerkUser,
  type ResolvedIdentity,
  type RoleContext,
  RoleContextSchema,
} from "@servyn/domain-identity";
import { MFA_ENROLLED_COOKIE, verifyMfaEnrolledToken } from "@/lib/mfa-session-cookie";

export const ACTIVE_ROLE_COOKIE = "sv_active_role";

export interface CurrentSessionIdentity {
  identity: ResolvedIdentity;
  clerkUserId: string;
  hasMfa: boolean;
  activeRole: RoleContext;
}

/**
 * Clerk's `fva` session claim is a `[firstFactorAge, secondFactorAge]` tuple.
 * When `fva[1] >= 0`, a second factor was verified on the current session.
 */
export function hasVerifiedMfa(sessionClaims: unknown): boolean {
  if (typeof sessionClaims !== "object" || sessionClaims === null || !("fva" in sessionClaims)) {
    return false;
  }
  const fva = sessionClaims.fva;
  if (!Array.isArray(fva) || fva.length < 2) return false;
  const secondFactorAge: unknown = fva[1];
  return typeof secondFactorAge === "number" && secondFactorAge >= 0;
}

export async function getCurrentIdentity(): Promise<CurrentSessionIdentity | null> {
  const { userId: clerkUserId, sessionId, sessionClaims } = await auth();
  if (!clerkUserId) return null;

  const db = getDb();
  const repo = createIdentityRepository(db);

  const found = await repo.findIdentityWithRolesByClerkId(clerkUserId);

  // JIT fallback if user.created webhook hasn't arrived yet (or in local dev without tunnel)
  let identity: ResolvedIdentity;
  if (!found) {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const primaryEmail =
      clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
        ?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress ??
      `${clerkUserId}@clerk.local`;

    const primaryPhone =
      clerkUser.phoneNumbers.find((p) => p.id === clerkUser.primaryPhoneNumberId)?.phoneNumber ??
      clerkUser.phoneNumbers[0]?.phoneNumber ??
      null;

    const fullName = [clerkUser.firstName, clerkUser.lastName]
      .filter((p): p is string => Boolean(p && p.trim().length > 0))
      .join(" ")
      .trim();

    const displayName =
      fullName.length > 0
        ? fullName
        : (clerkUser.username ?? primaryEmail.split("@")[0] ?? "Servyn Member");

    identity = await syncClerkUser(repo, {
      clerkUserId,
      email: primaryEmail,
      phone: primaryPhone,
      displayName,
    });
  } else {
    identity = {
      user: found.user,
      customerProfile: found.customerProfile,
      vendorProfile: found.vendorProfile,
      roles: resolveRoles(found.user, found.customerProfile, found.vendorProfile),
    };
  }

  const cookieStore = await cookies();
  const cookieRole = cookieStore.get(ACTIVE_ROLE_COOKIE)?.value;
  const parsedCookie = RoleContextSchema.safeParse(cookieRole);
  const activeRole: RoleContext =
    parsedCookie.success && identity.roles.includes(parsedCookie.data)
      ? parsedCookie.data
      : "customer";

  const hasMfa =
    hasVerifiedMfa(sessionClaims) ||
    (await verifyMfaEnrolledToken(
      cookieStore.get(MFA_ENROLLED_COOKIE)?.value,
      clerkUserId,
      sessionId,
    ));

  return {
    identity,
    clerkUserId,
    hasMfa,
    activeRole,
  };
}

export async function requireAuth(): Promise<CurrentSessionIdentity> {
  const current = await getCurrentIdentity();
  if (!current) {
    redirect("/sign-in");
  }
  if (current.identity.user.status !== "active") {
    redirect("/suspended");
  }
  return current;
}

export async function requireRole(
  role: RoleContext,
  options: { requireMfa?: boolean; returnTo?: string } = {},
): Promise<
  | { allowed: true; session: CurrentSessionIdentity }
  | { allowed: false; status: 403; session: CurrentSessionIdentity }
> {
  const session = await requireAuth();
  const decision = authorizeRole(session.identity, role, {
    requireMfa: options.requireMfa ?? false,
    hasMfa: session.hasMfa,
    returnTo: options.returnTo,
  });

  if (!decision.allowed) {
    if (decision.httpStatus === 307 && decision.redirectTo) {
      redirect(decision.redirectTo);
    }
    return { allowed: false, status: 403, session };
  }

  return { allowed: true, session };
}
