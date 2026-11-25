import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { asUserId } from "@servyn/core";
import { getDb } from "@servyn/db";
import {
  BecomeSellerInputSchema,
  becomeSeller,
  createIdentityRepository,
  resolveRoles,
} from "@servyn/domain-identity";
import { getClientIp, verifyTurnstileToken } from "@servyn/observability";
import { ACTIVE_ROLE_COOKIE, getCurrentIdentity } from "@/lib/auth";
import { createApiLogger, enforceRateLimit } from "@/lib/api-guard";

const logger = createApiLogger("api.me.become-seller");

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

  const body: unknown = await request.json().catch(() => ({}));
  const parsed = BecomeSellerInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid seller details" } },
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

  const fallbackName =
    parsed.data.businessName ?? current.identity.customerProfile?.displayName ?? "Servyn Seller";

  try {
    const repo = createIdentityRepository(getDb());
    const vendorProfile = await becomeSeller(repo, asUserId(current.identity.user.id), {
      businessName: fallbackName,
      description: parsed.data.description ?? null,
    });
    const roles = resolveRoles(
      current.identity.user,
      current.identity.customerProfile,
      vendorProfile,
    );

    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_ROLE_COOKIE, "seller", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });

    logger.info("seller_storefront_activated", { userId: current.identity.user.id });

    return NextResponse.json({
      ok: true,
      vendorProfile,
      roles,
      requiresMfa: !current.hasMfa,
    });
  } catch (err) {
    logger.error("seller_storefront_activation_failed", {
      userId: current.identity.user.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INTERNAL_ERROR", message: "Could not activate seller storefront" },
      },
      { status: 500 },
    );
  }
}
