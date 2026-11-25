import { describe, expect, it } from "vitest";
import { REDACTED, redactSentryEvent, redactString, redactValue } from "./redact.js";

describe("redactString", () => {
  it("redacts Bearer tokens, API keys, card numbers, presigned URLs, and emails", () => {
    expect(redactString("Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.abc.def")).toBe(
      `Authorization: Bearer ${REDACTED}`,
    );
    expect(redactString("stripe=sk_live_1234567890abcdef")).toBe(`stripe=${REDACTED}`);
    expect(redactString("card 4111 1111 1111 1111 charged")).toBe(`card ${REDACTED} charged`);
    expect(redactString("https://r2.example/doc.pdf?X-Amz-Signature=deadbeef&foo=1")).toBe(
      `https://r2.example/doc.pdf?X-Amz-Signature=${REDACTED}&foo=1`,
    );
    expect(redactString("user ada@example.com signed in")).toBe("user a***@example.com signed in");
  });
});

describe("redactValue", () => {
  it("redacts sensitive keys, chat bodies, Errors, and handles circular references", () => {
    const circular: Record<string, unknown> = {
      password: "super-secret-password",
      apiKey: "secret-key",
      signedUrl: "https://r2.example/file",
      dbsNumber: "00123456789",
      safeField: "ok",
    };
    circular["self"] = circular;

    const out = redactValue(circular) as Record<string, unknown>;
    expect(out["password"]).toBe(REDACTED);
    expect(out["apiKey"]).toBe(REDACTED);
    expect(out["signedUrl"]).toBe(REDACTED);
    expect(out["dbsNumber"]).toBe(REDACTED);
    expect(out["safeField"]).toBe("ok");
    expect(out["self"]).toBe("[CIRCULAR]");

    const chatOut = redactValue({ conversationId: "conv_1", body: "hello private" }) as Record<
      string,
      unknown
    >;
    expect(chatOut["body"]).toBe(REDACTED);

    const err = redactValue(new Error("failed with Bearer abc123")) as Record<string, unknown>;
    expect(err["message"]).toBe(`failed with Bearer ${REDACTED}`);
  });
});

describe("redactSentryEvent", () => {
  it("strips user PII, request headers/cookies, and redacts extra fields", () => {
    const scrubbed = redactSentryEvent({
      user: { id: "usr_1", email: "ada@example.com", ip_address: "1.2.3.4" },
      request: {
        headers: { authorization: "Bearer secret" },
        cookies: { session: "abc" },
        data: { token: "tok_123" },
      },
      extra: { apiKey: "sk_test_abcdef123456" },
    });

    expect(scrubbed.user).toEqual({ id: "usr_1" });
    expect(scrubbed.request.headers).toBe(REDACTED);
    expect(scrubbed.request.cookies).toBe(REDACTED);
    expect((scrubbed.request.data as Record<string, unknown>)["token"]).toBe(REDACTED);
    expect((scrubbed.extra as Record<string, unknown>)["apiKey"]).toBe(REDACTED);
  });
});
