import { NextResponse } from "next/server";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { MFA_ENROLLED_COOKIE, signMfaEnrolledToken } from "@/lib/mfa-session-cookie";
import { createApiLogger, enforceRateLimit } from "@/lib/api-guard";

const logger = createApiLogger("api.auth.mfa-enrolled");
const ENROLLMENT_WINDOW_MS = 5 * 60 * 1000;
const CLOCK_SKEW_MS = 5_000;

export async function POST(): Promise<NextResponse> {
  try {
    const { userId, sessionId } = await auth();
    if (!userId || !sessionId) {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required" } },
        { status: 401 },
      );
    }

    const rateLimited = await enforceRateLimit("auth", userId);
    if (rateLimited) return rateLimited;

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "User not found" } },
        { status: 401 },
      );
    }

    if (!clerkUser.twoFactorEnabled || !clerkUser.totpEnabled) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "MFA_NOT_ENABLED", message: "Two-factor authentication is not enabled" },
        },
        { status: 403 },
      );
    }

    const client = await clerkClient();
    const clerkSession = await client.sessions.getSession(sessionId);
    if (clerkSession.status !== "active" || clerkSession.userId !== userId) {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "Active session required" } },
        { status: 401 },
      );
    }

    const now = Date.now();
    const isFreshEnrollment =
      clerkUser.updatedAt >= clerkSession.createdAt - CLOCK_SKEW_MS &&
      now - clerkUser.updatedAt <= ENROLLMENT_WINDOW_MS;

    if (!isFreshEnrollment) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "MFA_ENROLLMENT_NOT_RECENT",
            message: "Please verify your existing 2FA code to continue.",
          },
        },
        { status: 403 },
      );
    }

    const token = await signMfaEnrolledToken(userId, sessionId, { nowMs: now });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(MFA_ENROLLED_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60,
    });

    logger.info("mfa_enrollment_recorded", { userId });
    return response;
  } catch (err) {
    logger.error("mfa_enrollment_record_failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INTERNAL_ERROR", message: "Could not record MFA enrollment" },
      },
      { status: 500 },
    );
  }
}
