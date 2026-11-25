export const CONSENT_STORAGE_KEY = "servyn_cookie_consent_v1";
export const CONSENT_COOKIE_NAME = "sv_consent";
export const CONSENT_CHANGE_EVENT = "servyn-cookie-consent-change";
export const OPEN_CONSENT_EVENT = "servyn-open-cookie-preferences";

export interface ConsentPreferences {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
  version: 1;
}

export function parseConsent(raw: string | null): ConsentPreferences | null {
  if (!raw || raw === "ssr-hidden") return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const obj = parsed as Record<string, unknown>;
    if (obj["essential"] !== true) return null;
    if (typeof obj["analytics"] !== "boolean") return null;
    if (typeof obj["marketing"] !== "boolean") return null;

    return {
      essential: true,
      analytics: obj["analytics"],
      marketing: obj["marketing"],
      updatedAt:
        typeof obj["updatedAt"] === "string"
          ? obj["updatedAt"]
          : new Date().toISOString(),
      version: 1,
    };
  } catch {
    return null;
  }
}

export function readStoredConsentRaw(): string | null {
  if (typeof window === "undefined") return "ssr-hidden";
  try {
    return window.localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function readStoredConsent(): ConsentPreferences | null {
  return parseConsent(readStoredConsentRaw());
}

export function writeStoredConsent(input: {
  analytics: boolean;
  marketing: boolean;
  updatedAt?: string;
}): ConsentPreferences {
  const prefs: ConsentPreferences = {
    essential: true,
    analytics: input.analytics,
    marketing: input.marketing,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
    version: 1,
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(prefs));
      const cookieVal = encodeURIComponent(
        JSON.stringify({ a: prefs.analytics ? 1 : 0, m: prefs.marketing ? 1 : 0, v: 1 }),
      );
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${CONSENT_COOKIE_NAME}=${cookieVal}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
      window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
    } catch {
      // Ignore storage write failures when cookies/storage are restricted.
    }
  }

  return prefs;
}

export function subscribeConsent(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(CONSENT_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CONSENT_CHANGE_EVENT, callback);
  };
}

export function openCookiePreferences(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_CONSENT_EVENT));
}
