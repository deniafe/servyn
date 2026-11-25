import { afterEach, describe, expect, it, vi } from "vitest";
import { TEST_FAIL_TOKEN, verifyTurnstileToken } from "./turnstile.js";

describe("verifyTurnstileToken", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("bypasses in non-production when TURNSTILE_SECRET_KEY is unset unless TEST_FAIL_TOKEN is passed", async () => {
    delete process.env["TURNSTILE_SECRET_KEY"];
    process.env["NODE_ENV"] = "test";

    const ok = await verifyTurnstileToken(undefined);
    expect(ok).toEqual({ success: true, errorCodes: [], bypassed: true });

    const fail = await verifyTurnstileToken(TEST_FAIL_TOKEN);
    expect(fail.success).toBe(false);
  });

  it("fails closed in production when TURNSTILE_SECRET_KEY is missing", async () => {
    delete process.env["TURNSTILE_SECRET_KEY"];
    process.env["NODE_ENV"] = "production";

    const res = await verifyTurnstileToken("some-token");
    expect(res).toEqual({ success: false, errorCodes: ["missing-secret-key"] });
  });

  it("verifies token against Cloudflare siteverify when secret key is configured", async () => {
    process.env["TURNSTILE_SECRET_KEY"] = "secret_123";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: true, "error-codes": [] }), { status: 200 }),
    );

    const res = await verifyTurnstileToken("cf-token", "127.0.0.1");
    expect(res).toEqual({ success: true, errorCodes: [] });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const missing = await verifyTurnstileToken("");
    expect(missing).toEqual({ success: false, errorCodes: ["missing-input-response"] });
  });
});
