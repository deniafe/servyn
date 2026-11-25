"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  OPEN_CONSENT_EVENT,
  parseConsent,
  readStoredConsentRaw,
  subscribeConsent,
  writeStoredConsent,
} from "@/lib/consent";

function getServerConsentSnapshot(): string | null {
  return "ssr-hidden";
}

export function CookieNotice() {
  const shouldReduceMotion = useReducedMotion();
  const { isSignedIn } = useAuth();

  const storedConsentRaw = React.useSyncExternalStore(
    subscribeConsent,
    readStoredConsentRaw,
    getServerConsentSnapshot,
  );
  const storedConsent = parseConsent(storedConsentRaw);

  const [prefsOpen, setPrefsOpen] = React.useState(false);
  const [analytics, setAnalytics] = React.useState(true);
  const [marketing, setMarketing] = React.useState(false);

  // Sync from DB when signed in if local storage has no decision yet.
  React.useEffect(() => {
    if (!isSignedIn || storedConsent !== null) return;
    let active = true;

    void fetch("/api/v1/me/consent")
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          data: {
            ok?: boolean;
            consent?: { analytics: boolean; marketing: boolean; updatedAt?: string } | null;
          } | null,
        ) => {
          if (!active || !data?.ok || !data.consent) return;
          writeStoredConsent({
            analytics: data.consent.analytics,
            marketing: data.consent.marketing,
            updatedAt: data.consent.updatedAt,
          });
        },
      )
      .catch(() => {
        // Non-blocking: fall back to banner prompt if consent fetch fails.
      });

    return () => {
      active = false;
    };
  }, [isSignedIn, storedConsent]);

  // Listen for programmatic open events (Footer, /account).
  React.useEffect(() => {
    const handleOpen = () => {
      const current = parseConsent(readStoredConsentRaw());
      if (current) {
        setAnalytics(current.analytics);
        setMarketing(current.marketing);
      }
      setPrefsOpen(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, handleOpen);
  }, []);

  function persistConsent(next: { analytics: boolean; marketing: boolean }) {
    writeStoredConsent(next);
    if (isSignedIn) {
      void fetch("/api/v1/me/consent", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      }).catch(() => {
        // Local consent is already saved; DB sync is best-effort.
      });
    }
  }

  const isVisible = storedConsentRaw === null;

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.aside
            role="region"
            aria-label="Cookie notice"
            initial={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 12, scale: 0.98 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 10, scale: 0.98 }
            }
            transition={
              shouldReduceMotion
                ? { duration: 0.2 }
                : { type: "spring", bounce: 0, duration: 0.34 }
            }
            className="apple-glass-dock fixed right-4 bottom-4 left-4 z-[120] rounded-[12px] border border-cream/10 px-4 py-3 text-cream shadow-[0_12px_32px_rgba(7,30,22,0.4)] min-[721px]:right-auto min-[721px]:bottom-4 min-[721px]:left-6 min-[721px]:w-auto"
          >
            <div className="flex flex-col gap-3 min-[721px]:flex-row min-[721px]:items-center min-[721px]:gap-4">
              <p className="text-[12px] text-cream-75">
                Essential cookies keep Servyn working; analytics are optional.
              </p>

              <div className="flex shrink-0 items-center gap-2">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() =>
                    persistConsent({ analytics: true, marketing: true })
                  }
                  className="h-8 cursor-pointer rounded-[8px] bg-gold-500 px-3 text-[12px] font-medium text-gold-ink transition-colors duration-150 ease-standard hover:bg-gold-400"
                >
                  Accept
                </motion.button>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() =>
                    persistConsent({ analytics: false, marketing: false })
                  }
                  className="h-8 cursor-pointer rounded-[8px] border border-cream/12 bg-leaf-900 px-3 text-[12px] font-medium text-cream transition-colors duration-150 ease-standard hover:bg-leaf-800"
                >
                  Essential
                </motion.button>

                <button
                  type="button"
                  onClick={() => {
                    if (storedConsent) {
                      setAnalytics(storedConsent.analytics);
                      setMarketing(storedConsent.marketing);
                    }
                    setPrefsOpen(true);
                  }}
                  className="cursor-pointer px-1 text-[12px] font-normal text-cream-60 underline decoration-cream/30 underline-offset-4 transition-colors duration-150 ease-standard hover:text-cream"
                >
                  Preferences
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <Dialog open={prefsOpen} onOpenChange={setPrefsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cookie preferences</DialogTitle>
            <DialogDescription>
              Essential cookies keep your session and basket working. Optional
              analytics and service updates only run with your consent.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-md border border-line bg-surface-2 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-ink">
                  Essential cookies
                </p>
                <p className="text-xs text-mut">
                  Always on for security, sign-in, and booking state.
                </p>
              </div>
              <span className="rounded-full bg-mint px-2.5 py-1 text-[11px] font-bold text-mint-d">
                Always on
              </span>
            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-md border border-line bg-surface px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-ink">
                  Analytics (PostHog EU)
                </p>
                <p className="text-xs text-mut">
                  Helps us improve search accuracy and Manchester coverage.
                </p>
              </div>
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="size-4 accent-leaf-600"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-md border border-line bg-surface px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-ink">
                  City &amp; marketplace updates
                </p>
                <p className="text-xs text-mut">
                  Optional updates on new local providers and market drops.
                </p>
              </div>
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="size-4 accent-leaf-600"
              />
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPrefsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                persistConsent({ analytics, marketing });
                setPrefsOpen(false);
              }}
            >
              Save preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
