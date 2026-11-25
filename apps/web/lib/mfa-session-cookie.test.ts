import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { signMfaEnrolledToken, verifyMfaEnrolledToken } from "./mfa-session-cookie";

describe("mfa-session-cookie", () => {
  const originalSecret = process.env["CLERK_SECRET_KEY"];

  beforeEach(() => {
    process.env["CLERK_SECRET_KEY"] = "sk_test_servyn_unit_secret_key";
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env["CLERK_SECRET_KEY"];
    } else {
      process.env["CLERK_SECRET_KEY"] = originalSecret;
    }
  });

  it("signs and verifies a valid token for matching userId and sessionId", async () => {
    const now = 1_700_000_000_000;
    const token = await signMfaEnrolledToken("user_123", "sess_456", {
      nowMs: now,
      ttlMs: 60_000,
    });

    await expect(verifyMfaEnrolledToken(token, "user_123", "sess_456", now + 30_000)).resolves.toBe(
      true,
    );
  });

  it("rejects tampered signatures", async () => {
    const now = 1_700_000_000_000;
    const token = await signMfaEnrolledToken("user_123", "sess_456", { nowMs: now });
    const parts = token.split(".");
    const tampered = `${parts[0]}.${parts[1]}.${parts[2]}.${"0".repeat(parts[3]?.length ?? 64)}`;

    await expect(verifyMfaEnrolledToken(tampered, "user_123", "sess_456", now)).resolves.toBe(
      false,
    );
  });

  it("rejects tokens presented by a different user or session", async () => {
    const now = 1_700_000_000_000;
    const token = await signMfaEnrolledToken("user_123", "sess_456", { nowMs: now });

    await expect(verifyMfaEnrolledToken(token, "user_other", "sess_456", now)).resolves.toBe(false);
    await expect(verifyMfaEnrolledToken(token, "user_123", "sess_other", now)).resolves.toBe(false);
  });

  it("rejects expired tokens", async () => {
    const now = 1_700_000_000_000;
    const token = await signMfaEnrolledToken("user_123", "sess_456", {
      nowMs: now,
      ttlMs: 10_000,
    });

    await expect(verifyMfaEnrolledToken(token, "user_123", "sess_456", now + 10_001)).resolves.toBe(
      false,
    );
  });

  it("fails closed when CLERK_SECRET_KEY is missing", async () => {
    const now = 1_700_000_000_000;
    const token = await signMfaEnrolledToken("user_123", "sess_456", { nowMs: now });
    delete process.env["CLERK_SECRET_KEY"];

    await expect(verifyMfaEnrolledToken(token, "user_123", "sess_456", now)).resolves.toBe(false);
    await expect(signMfaEnrolledToken("user_123", "sess_456")).rejects.toThrow(/CLERK_SECRET_KEY/);
  });
});
