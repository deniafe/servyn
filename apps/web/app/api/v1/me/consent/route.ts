import { NextResponse } from "next/server";
import { asUserId } from "@servyn/core";
import { getDb } from "@servyn/db";
import {
  UpdateConsentInputSchema,
  createIdentityRepository,
  updateConsentPreferences,
} from "@servyn/domain-identity";
import { getCurrentIdentity } from "@/lib/auth";
import { createApiLogger, enforceRateLimit } from "@/lib/api-guard";

const logger = createApiLogger("api.me.consent");

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
    consent: current.identity.user.consentPreferences,
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
  const parsed = UpdateConsentInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid consent preferences" } },
      { status: 400 },
    );
  }

  try {
    const repo = createIdentityRepository(getDb());
    const consent = await updateConsentPreferences(
      repo,
      asUserId(current.identity.user.id),
      parsed.data,
    );

    logger.info("consent_updated", {
      userId: current.identity.user.id,
      analytics: consent.analytics,
      marketing: consent.marketing,
    });

    return NextResponse.json({ ok: true, consent });
  } catch (err) {
    logger.error("consent_update_failed", {
      userId: current.identity.user.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Could not save consent preferences" } },
      { status: 500 },
    );
  }
}
