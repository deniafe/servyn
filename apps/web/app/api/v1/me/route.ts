import { NextResponse } from "next/server";
import { asUserId } from "@servyn/core";
import { getDb } from "@servyn/db";
import { UpdateMeInputSchema, createIdentityRepository } from "@servyn/domain-identity";
import { getCurrentIdentity } from "@/lib/auth";
import { createApiLogger, enforceRateLimit } from "@/lib/api-guard";

const logger = createApiLogger("api.me");

export async function GET(): Promise<NextResponse> {
  const current = await getCurrentIdentity();
  if (!current) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required" } },
      { status: 401 },
    );
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: current.identity.user.id,
      email: current.identity.user.email,
      status: current.identity.user.status,
      isAdmin: current.identity.user.isAdmin,
    },
    customerProfile: current.identity.customerProfile,
    vendorProfile: current.identity.vendorProfile,
    roles: current.identity.roles,
    activeRole: current.activeRole,
    hasMfa: current.hasMfa,
  });
}

export async function PATCH(request: Request): Promise<NextResponse> {
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

  const rateLimited = await enforceRateLimit("api", current.identity.user.id);
  if (rateLimited) return rateLimited;

  const body: unknown = await request.json().catch(() => null);
  const parsed = UpdateMeInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid profile data" } },
      { status: 400 },
    );
  }

  try {
    const repo = createIdentityRepository(getDb());
    const customerProfile = await repo.updateCustomerProfilePreferences(
      asUserId(current.identity.user.id),
      parsed.data,
    );

    logger.info("me_preferences_updated", { userId: current.identity.user.id });
    return NextResponse.json({ ok: true, customerProfile });
  } catch (err) {
    logger.error("me_preferences_update_failed", {
      userId: current.identity.user.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Could not update preferences" } },
      { status: 500 },
    );
  }
}
