import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { asUserId } from "@servyn/core";
import { getDb } from "@servyn/db";
import {
  BecomeVendorInputSchema,
  becomeVendor,
  createIdentityRepository,
  resolveRoles,
} from "@servyn/domain-identity";
import { getClientIp, verifyTurnstileToken } from "@servyn/observability";
import { ACTIVE_ROLE_COOKIE, getCurrentIdentity } from "@/lib/auth";
import { createApiLogger, enforceRateLimit } from "@/lib/api-guard";

const logger = createApiLogger("api.me.become-vendor");

export async function POST(request: Request): Promise<NextResponse> {
  const current = await getCurrentIdentity();
  if (!current) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required" } },
      { status: 401 },
    );
  }
  if (current.identity.user.status !== "active") {
    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", message: "Account is not active" } },
      { status: 403 },
    );
  }

  const rateLimited = await enforceRateLimit("auth", current.identity.user.id);
  if (rateLimited) return rateLimited;

  const body: unknown = await request.json().catch(() => null);
  const parsed = BecomeVendorInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid vendor details" } },
      { status: 400 },
    );
  }

  const turnstile = await verifyTurnstileToken(
    parsed.data.turnstileToken,
    getClientIp(request),
  );
  if (!turnstile.success) {
    logger.warn("turnstile_rejected", {
      userId: current.identity.user.id,
      errorCodes: turnstile.errorCodes,
    });
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "TURNSTILE_FAILED",
          message: "Bot verification failed. Please retry the check and submit again.",
        },
      },
      { status: 400 },
    );
  }

  try {
    const repo = createIdentityRepository(getDb());
    const vendorProfile = await becomeVendor(repo, asUserId(current.identity.user.id), parsed.data);
    const roles = resolveRoles(
      current.identity.user,
      current.identity.customerProfile,
      vendorProfile,
    );

    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_ROLE_COOKIE, "vendor", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });

    logger.info("vendor_profile_activated", { userId: current.identity.user.id });

    return NextResponse.json({
      ok: true,
      vendorProfile,
      roles,
      requiresMfa: !current.hasMfa,
    });
  } catch (err) {
    logger.error("vendor_profile_activation_failed", {
      userId: current.identity.user.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INTERNAL_ERROR", message: "Could not activate vendor profile" },
      },
      { status: 500 },
    );
  }
}
