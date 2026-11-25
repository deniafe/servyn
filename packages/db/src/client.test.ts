import { describe, expect, it } from "vitest";
import { normalizeConnectionString } from "./client";

describe("normalizeConnectionString", () => {
  it("upgrades sslmode=require to sslmode=verify-full when uselibpqcompat is absent", () => {
    const result = normalizeConnectionString(
      "postgresql://user:pass@ep-example.neon.tech/servyn?channel_binding=require&sslmode=require",
    );
    const parsed = new URL(result);
    expect(parsed.searchParams.get("sslmode")).toBe("verify-full");
    expect(parsed.searchParams.get("channel_binding")).toBe("require");
  });

  it("preserves sslmode=require when uselibpqcompat is present", () => {
    const raw =
      "postgresql://user:pass@ep-example.neon.tech/servyn?uselibpqcompat=true&sslmode=require";
    expect(normalizeConnectionString(raw)).toBe(raw);
  });

  it("leaves sslmode=verify-full unchanged", () => {
    const raw = "postgresql://user:pass@ep-example.neon.tech/servyn?sslmode=verify-full";
    expect(normalizeConnectionString(raw)).toBe(raw);
  });

  it("returns malformed connection strings unchanged without throwing", () => {
    const raw = "not-a-valid-url";
    expect(normalizeConnectionString(raw)).toBe(raw);
  });
});
