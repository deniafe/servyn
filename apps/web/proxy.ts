import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { MFA_ENROLLED_COOKIE, verifyMfaEnrolledToken } from "@/lib/mfa-session-cookie";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/vendor(.*)",
  "/seller(.*)",
  "/account(.*)",
  "/onboarding(.*)",
  "/admin(.*)",
  "/api/v1/(.*)",
]);

const isMfaRoute = createRouteMatcher(["/vendor(.*)", "/seller(.*)", "/admin(.*)"]);

function hasMfaClaim(sessionClaims: unknown): boolean {
  if (typeof sessionClaims !== "object" || sessionClaims === null || !("fva" in sessionClaims)) {
    return false;
  }
  const fva = sessionClaims.fva;
  if (!Array.isArray(fva) || fva.length < 2) return false;
  return typeof fva[1] === "number" && fva[1] >= 0;
}

export default clerkMiddleware(async (auth, req) => {
  if (!isProtectedRoute(req)) return;

  const session = await auth.protect();

  if (isMfaRoute(req)) {
    const hasSessionMfa =
      hasMfaClaim(session.sessionClaims) ||
      (await verifyMfaEnrolledToken(
        req.cookies.get(MFA_ENROLLED_COOKIE)?.value,
        session.userId,
        session.sessionId,
      ));
    if (!hasSessionMfa) {
      const mfaUrl = new URL("/mfa-required", req.url);
      mfaUrl.searchParams.set("redirect_url", req.nextUrl.pathname);
      return NextResponse.redirect(mfaUrl);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
