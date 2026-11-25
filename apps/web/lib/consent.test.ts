import { describe, expect, it } from "vitest";
import { parseConsent } from "./consent.js";

describe("parseConsent", () => {
  it("returns null for empty, ssr-hidden, malformed, or invalid payloads", () => {
    expect(parseConsent(null)).toBeNull();
    expect(parseConsent("ssr-hidden")).toBeNull();
    expect(parseConsent("{not-json")).toBeNull();
    expect(parseConsent(JSON.stringify({ essential: false, analytics: true, marketing: false }))).toBeNull();
  });

  it("parses legacy v1 payloads and full ConsentPreferences payloads", () => {
    const legacy = parseConsent(JSON.stringify({ essential: true, analytics: true, marketing: false }));
    expect(legacy?.essential).toBe(true);
    expect(legacy?.analytics).toBe(true);
    expect(legacy?.marketing).toBe(false);
    expect(legacy?.version).toBe(1);

    const full = parseConsent(
      JSON.stringify({
        essential: true,
        analytics: false,
        marketing: true,
        updatedAt: "2026-11-25T12:00:00.000Z",
        version: 1,
      }),
    );
    expect(full).toEqual({
      essential: true,
      analytics: false,
      marketing: true,
      updatedAt: "2026-11-25T12:00:00.000Z",
      version: 1,
    });
  });
});
