import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, RATE_LIMIT_BUCKETS, resetInMemoryRateLimits } from "./rate-limit.js";

describe("checkRateLimit (in-memory fallback)", () => {
  beforeEach(() => {
    resetInMemoryRateLimits();
    delete process.env["UPSTASH_REDIS_REST_URL"];
    delete process.env["UPSTASH_REDIS_REST_TOKEN"];
  });

  it("allows up to bucket limit then returns allowed:false with retryAfterSeconds", async () => {
    const limit = RATE_LIMIT_BUCKETS.report.limit;
    const now = 1_700_000_000_000;

    for (let i = 0; i < limit; i += 1) {
      const res = await checkRateLimit("report", "user_1", now + i);
      expect(res.allowed).toBe(true);
      expect(res.backend).toBe("memory");
    }

    const blocked = await checkRateLimit("report", "user_1", now + limit + 1);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);

    // After the window expires, requests are allowed again.
    const afterWindow = await checkRateLimit(
      "report",
      "user_1",
      now + RATE_LIMIT_BUCKETS.report.windowMs + 1000,
    );
    expect(afterWindow.allowed).toBe(true);
  });
});
