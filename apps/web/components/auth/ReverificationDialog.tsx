"use client";

import * as React from "react";
import { useSession } from "@clerk/nextjs";
import { ArrowRight, KeyRound, Lock, Mail, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ReverificationLevel = "first_factor" | "second_factor" | "multi_factor";

export interface ReverificationRequest {
  level?: ReverificationLevel;
  complete: () => void;
  cancel: () => void;
}

export interface ReverificationDialogProps {
  request: ReverificationRequest | null;
  onClose: () => void;
}

type VerificationStrategy = "email_code" | "password";

interface EmailCodeInfo {
  emailAddressId: string;
  safeIdentifier: string | null;
}

function extractErrorMessage(err: unknown): string {
  if (typeof err === "object" && err !== null) {
    if ("errors" in err && Array.isArray(err.errors) && err.errors.length > 0) {
      const first: unknown = err.errors[0];
      if (typeof first === "object" && first !== null) {
        if ("longMessage" in first && typeof first.longMessage === "string") {
          return first.longMessage;
        }
        if ("message" in first && typeof first.message === "string") {
          return first.message;
        }
      }
    }
    if ("message" in err && typeof err.message === "string") {
      return err.message;
    }
  }
  return "Verification failed. Please check your entry and try again.";
}

function parseSupportedFactors(factors: unknown): {
  emailCode: EmailCodeInfo | null;
  hasPassword: boolean;
} {
  let emailCode: EmailCodeInfo | null = null;
  let hasPassword = false;

  if (!Array.isArray(factors)) {
    return { emailCode, hasPassword };
  }

  for (const item of factors) {
    if (typeof item !== "object" || item === null || !("strategy" in item)) continue;
    const strategy = item.strategy;
    if (
      strategy === "email_code" &&
      "emailAddressId" in item &&
      typeof item.emailAddressId === "string"
    ) {
      const safeIdentifier =
        "safeIdentifier" in item && typeof item.safeIdentifier === "string"
          ? item.safeIdentifier
          : null;
      emailCode = {
        emailAddressId: item.emailAddressId,
        safeIdentifier,
      };
    } else if (strategy === "password") {
      hasPassword = true;
    }
  }

  return { emailCode, hasPassword };
}

export function ReverificationDialog({ request, onClose }: ReverificationDialogProps) {
  const { session } = useSession();

  const [isInitializing, setIsInitializing] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [strategy, setStrategy] = React.useState<VerificationStrategy>("email_code");
  const [emailCodeInfo, setEmailCodeInfo] = React.useState<EmailCodeInfo | null>(null);
  const [hasPassword, setHasPassword] = React.useState(false);
  const [emailPrepared, setEmailPrepared] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  const startedRequestRef = React.useRef<ReverificationRequest | null>(null);
  const completedRef = React.useRef(false);
  const lastAutoSubmittedCodeRef = React.useRef<string | null>(null);

  // Cooldown timer for resending email code
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const resetFormState = React.useCallback(() => {
    lastAutoSubmittedCodeRef.current = null;
    setCode("");
    setPassword("");
    setError(null);
    setEmailPrepared(false);
    setResendCooldown(0);
    setIsInitializing(false);
    setIsSubmitting(false);
  }, []);

  // Initialize session verification once per incoming request
  React.useEffect(() => {
    if (!request) {
      startedRequestRef.current = null;
      completedRef.current = false;
      return;
    }

    if (!session || startedRequestRef.current === request) return;
    startedRequestRef.current = request;
    completedRef.current = false;

    let cancelled = false;

    void (async () => {
      setIsInitializing(true);
      setError(null);
      try {
        const verification = await session.startVerification({
          level: request.level ?? "first_factor",
        });

        if (cancelled) return;

        if (verification.status === "complete") {
          completedRef.current = true;
          resetFormState();
          request.complete();
          onClose();
          return;
        }

        const parsed = parseSupportedFactors(verification.supportedFirstFactors);
        setEmailCodeInfo(parsed.emailCode);
        setHasPassword(parsed.hasPassword);

        if (parsed.emailCode) {
          setStrategy("email_code");
          await session.prepareFirstFactorVerification({
            strategy: "email_code",
            emailAddressId: parsed.emailCode.emailAddressId,
          });
          if (!cancelled) {
            setEmailPrepared(true);
            setResendCooldown(30);
          }
        } else if (parsed.hasPassword) {
          setStrategy("password");
        } else {
          setError("No supported verification method is available for this session.");
        }
      } catch (err) {
        if (!cancelled) {
          setError(extractErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [request, session, onClose, resetFormState]);

  function handleDismiss() {
    if (request && !completedRef.current) {
      request.cancel();
    }
    resetFormState();
    onClose();
  }

  async function handleResendCode() {
    if (!session || !emailCodeInfo || resendCooldown > 0) return;
    setError(null);
    try {
      await session.prepareFirstFactorVerification({
        strategy: "email_code",
        emailAddressId: emailCodeInfo.emailAddressId,
      });
      setEmailPrepared(true);
      setResendCooldown(30);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  async function handleSwitchStrategy(next: VerificationStrategy) {
    setError(null);
    setStrategy(next);
    if (next === "email_code" && !emailPrepared && session && emailCodeInfo) {
      try {
        await session.prepareFirstFactorVerification({
          strategy: "email_code",
          emailAddressId: emailCodeInfo.emailAddressId,
        });
        setEmailPrepared(true);
        setResendCooldown(30);
      } catch (err) {
        setError(extractErrorMessage(err));
      }
    }
  }

  async function submitVerification(nextStrategy: VerificationStrategy, rawCode: string) {
    if (!session || !request || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const result =
        nextStrategy === "email_code"
          ? await session.attemptFirstFactorVerification({
              strategy: "email_code",
              code: rawCode.trim(),
            })
          : await session.attemptFirstFactorVerification({
              strategy: "password",
              password,
            });

      if (result.status === "complete") {
        completedRef.current = true;
        resetFormState();
        request.complete();
        onClose();
        return;
      }

      setError("Additional verification is required. Please try again.");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submitVerification(strategy, code);
  }

  return (
    <Dialog
      open={Boolean(request)}
      onOpenChange={(open) => {
        if (!open) handleDismiss();
      }}
    >
      <DialogContent className="rounded-lg border border-line bg-surface p-6 text-ink shadow-soft sm:max-w-[420px]">
        <DialogHeader className="space-y-2 text-left">
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gold-50 px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] uppercase text-gold-700">
            <Lock className="size-3" aria-hidden="true" />
            <span>Security check</span>
          </div>
          <DialogTitle className="font-serif text-xl font-semibold text-ink">
            Confirm your identity
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed text-mut">
            {strategy === "email_code" && emailCodeInfo?.safeIdentifier
              ? `Enter the 6-digit verification code sent to ${emailCodeInfo.safeIdentifier}.`
              : strategy === "email_code"
                ? "Enter the 6-digit verification code sent to your email address."
                : "Enter your account password to continue setting up two-factor authentication."}
          </DialogDescription>
        </DialogHeader>

        {isInitializing ? (
          <div className="space-y-3 py-2">
            <div className="h-11 animate-pulse rounded-md bg-surface-2" />
            <div className="h-10 animate-pulse rounded-full bg-surface-2" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {strategy === "email_code" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="reverify-email-code"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-2"
                  >
                    <Mail className="size-3.5 text-gold-600" aria-hidden="true" />
                    <span>Verification code</span>
                  </label>
                  {emailCodeInfo ? (
                    <button
                      type="button"
                      onClick={() => void handleResendCode()}
                      disabled={resendCooldown > 0}
                      className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-leaf-600 hover:text-leaf-700 disabled:cursor-not-allowed disabled:text-mut"
                    >
                      <RefreshCw className="size-3" aria-hidden="true" />
                      <span>
                        {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend code"}
                      </span>
                    </button>
                  ) : null}
                </div>
                <input
                  id="reverify-email-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setCode(digits);
                    if (digits.length < 6) {
                      lastAutoSubmittedCodeRef.current = null;
                    } else if (lastAutoSubmittedCodeRef.current !== digits && !isSubmitting) {
                      lastAutoSubmittedCodeRef.current = digits;
                      void submitVerification("email_code", digits);
                    }
                  }}
                  placeholder="000000"
                  className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3.5 py-2.5 text-center text-lg font-semibold tracking-[0.28em] tabular-nums text-ink placeholder:text-mut focus:border-gold-500 focus:bg-surface focus:outline-none"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label
                  htmlFor="reverify-password"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-2"
                >
                  <KeyRound className="size-3.5 text-gold-600" aria-hidden="true" />
                  <span>Password</span>
                </label>
                <input
                  id="reverify-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-mut focus:border-gold-500 focus:bg-surface focus:outline-none"
                />
              </div>
            )}

            {error ? (
              <p
                role="alert"
                className="rounded-md bg-blush px-3 py-2 text-xs font-semibold text-blush-d"
              >
                {error}
              </p>
            ) : null}

            <div className="space-y-2.5 pt-1">
              <button
                type="submit"
                disabled={isSubmitting || (!emailCodeInfo && !hasPassword)}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-5 py-3 text-sm font-semibold text-gold-ink shadow-gold transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>{isSubmitting ? "Confirming..." : "Continue"}</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>

              {emailCodeInfo && hasPassword ? (
                <button
                  type="button"
                  onClick={() =>
                    void handleSwitchStrategy(strategy === "email_code" ? "password" : "email_code")
                  }
                  className="w-full cursor-pointer text-center text-xs font-semibold text-leaf-600 hover:text-leaf-700"
                >
                  {strategy === "email_code"
                    ? "Use password instead"
                    : "Use email verification code instead"}
                </button>
              ) : null}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
