import { afterEach, describe, expect, it, vi } from "vitest";
import { getFeatureFlag, isKillSwitchOpen } from "./flags.js";

describe("getFeatureFlag", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("forces validate-then-launch flags to false when env kill-switch is not true", async () => {
    process.env["FEATURE_PAYMENTS_PROTECTED_RELEASE"] = "false";
    process.env["FEATURE_CHILDCARE_ENHANCED"] = "false";
    process.env["FEATURE_ACCOUNTING_MTD"] = "false";

    const mockClient = {
      isFeatureEnabled: vi.fn().mockResolvedValue(true),
    };

    expect(isKillSwitchOpen("payments.protected_release")).toBe(false);
    expect(await getFeatureFlag("payments.protected_release", "usr_1", mockClient)).toBe(false);
    expect(await getFeatureFlag("childcare.enhanced", "usr_1", mockClient)).toBe(false);
    expect(await getFeatureFlag("accounting.mtd", "usr_1", mockClient)).toBe(false);
    expect(mockClient.isFeatureEnabled).not.toHaveBeenCalled();
  });

  it("evaluates PostHog client when kill-switch is open", async () => {
    process.env["FEATURE_CHILDCARE_ENHANCED"] = "true";
    const mockClient = {
      isFeatureEnabled: vi.fn().mockResolvedValue(true),
    };

    expect(await getFeatureFlag("childcare.enhanced", "usr_1", mockClient)).toBe(true);
    expect(mockClient.isFeatureEnabled).toHaveBeenCalledWith("childcare.enhanced", "usr_1");
  });
});
