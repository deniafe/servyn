import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SwitchRoleInputSchema } from "@servyn/domain-identity";
import { ACTIVE_ROLE_COOKIE, getCurrentIdentity } from "@/lib/auth";
import { createApiLogger, enforceRateLimit } from "@/lib/api-guard";

const logger = createApiLogger("api.auth.role");

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
  const parsed = SwitchRoleInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid role" } },
      { status: 400 },
    );
  }

  const { role } = parsed.data;
  if (!current.identity.roles.includes(role)) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "FORBIDDEN", message: `Role '${role}' is not enabled on this account` },
      },
      { status: 403 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  logger.info("role_switched", { userId: current.identity.user.id, activeRole: role });

  return NextResponse.json({ ok: true, activeRole: role });
}
