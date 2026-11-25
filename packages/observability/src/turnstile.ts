import { z } from "zod/v4";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
export const TEST_FAIL_TOKEN = "FAIL_TURNSTILE_TEST";

const TurnstileVerifyResponseSchema = z.object({
  success: z.boolean(),
  "error-codes": z.array(z.string()).optional(),
});

export interface TurnstileVerificationResult {
  success: boolean;
  errorCodes: string[];
  bypassed?: boolean;
}

export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string,
): Promise<TurnstileVerificationResult> {
  const secretKey = process.env["TURNSTILE_SECRET_KEY"]?.trim();

  if (!secretKey) {
    if (process.env["NODE_ENV"] === "production") {
      return { success: false, errorCodes: ["missing-secret-key"] };
    }
    if (token === TEST_FAIL_TOKEN) {
      return { success: false, errorCodes: ["invalid-input-response"] };
    }
    return { success: true, errorCodes: [], bypassed: true };
  }

  if (!token || token.trim().length === 0) {
    return { success: false, errorCodes: ["missing-input-response"] };
  }

  const form = new URLSearchParams();
  form.set("secret", secretKey);
  form.set("response", token.trim());
  if (remoteIp && remoteIp !== "unknown") {
    form.set("remoteip", remoteIp);
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      return { success: false, errorCodes: [`http-${response.status}`] };
    }

    const raw: unknown = await response.json();
    const parsed = TurnstileVerifyResponseSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, errorCodes: ["invalid-siteverify-response"] };
    }

    return {
      success: parsed.data.success,
      errorCodes: parsed.data["error-codes"] ?? [],
    };
  } catch {
    return { success: false, errorCodes: ["siteverify-network-error"] };
  }
}
