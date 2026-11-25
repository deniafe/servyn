"use client";

import * as React from "react";
import posthog from "posthog-js";
import { parseConsent, readStoredConsentRaw, subscribeConsent } from "@/lib/consent";

function getServerConsentSnapshot(): string | null {
  return "ssr-hidden";
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const rawConsent = React.useSyncExternalStore(
    subscribeConsent,
    readStoredConsentRaw,
    getServerConsentSnapshot,
  );
  const initializedRef = React.useRef(false);

  React.useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
    if (!apiKey) return;

    const consent = parseConsent(rawConsent);
    if (!consent || !consent.analytics) {
      if (initializedRef.current) {
        posthog.opt_out_capturing();
        posthog.reset();
      }
      return;
    }

    const host =
      process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://eu.i.posthog.com";

    if (!initializedRef.current) {
      posthog.init(apiKey, {
        api_host: host,
        person_profiles: "identified_only",
        capture_pageview: true,
        persistence: "localStorage+cookie",
      });
      initializedRef.current = true;
    } else {
      posthog.opt_in_capturing();
    }
  }, [rawConsent]);

  return <>{children}</>;
}
