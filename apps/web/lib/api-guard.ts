import { NextResponse } from "next/server";
import { checkRateLimit, createLogger, type RateLimitBucket } from "@servyn/observability";

export function createApiLogger(module: string) {
  return createLogger({ service: "web", module });
}

export async function enforceRateLimit(
  bucket: RateLimitBucket,
  identifier: string,
): Promise<NextResponse | null> {
  const result = await checkRateLimit(bucket, identifier);
  if (result.allowed) {
    return null;
  }

  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please try again shortly.",
      },
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": "0",
      },
    },
  );
}
