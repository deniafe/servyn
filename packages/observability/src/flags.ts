import { PostHog } from "posthog-node";

export type ValidateThenLaunchFlag =
  | "payments.protected_release"
  | "childcare.enhanced"
  | "accounting.mtd";

export type FeatureFlagName = ValidateThenLaunchFlag | (string & {});

const FLAG_KILL_SWITCH_ENV: Record<ValidateThenLaunchFlag, string> = {
  "payments.protected_release": "FEATURE_PAYMENTS_PROTECTED_RELEASE",
  "childcare.enhanced": "FEATURE_CHILDCARE_ENHANCED",
  "accounting.mtd": "FEATURE_ACCOUNTING_MTD",
};

let cachedPostHogClient: PostHog | null | undefined;

function getPostHogServerClient(): PostHog | null {
  if (cachedPostHogClient !== undefined) return cachedPostHogClient;
  const apiKey = process.env["NEXT_PUBLIC_POSTHOG_KEY"]?.trim();
  if (!apiKey) {
    cachedPostHogClient = null;
    return null;
  }
  const host = process.env["NEXT_PUBLIC_POSTHOG_HOST"]?.trim() || "https://eu.i.posthog.com";
  cachedPostHogClient = new PostHog(apiKey, { host });
  return cachedPostHogClient;
}

export function isKillSwitchOpen(flag: FeatureFlagName): boolean {
  if (flag in FLAG_KILL_SWITCH_ENV) {
    const envVar = FLAG_KILL_SWITCH_ENV[flag as ValidateThenLaunchFlag];
    return process.env[envVar] === "true";
  }
  return true;
}

export async function getFeatureFlag(
  flag: FeatureFlagName,
  distinctId?: string,
  clientOverride?: Pick<PostHog, "isFeatureEnabled">,
): Promise<boolean> {
  if (!isKillSwitchOpen(flag)) {
    return false;
  }

  const client = clientOverride ?? getPostHogServerClient();
  if (!client || !distinctId) {
    return false;
  }

  try {
    const enabled = await client.isFeatureEnabled(flag, distinctId);
    return enabled === true;
  } catch {
    return false;
  }
}
