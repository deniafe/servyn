"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useSignIn } from "@clerk/nextjs/legacy";
import { ArrowRight, Lock } from "lucide-react";

export interface CustomSignInFormProps {
  redirectUrl?: string;
}

type SecondFactorStrategy = "totp" | "phone_code" | "backup_code";

function getClerkErrorMessage(err: unknown): string {
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
  return "Invalid verification code or sign-in attempt. Please try again.";
}

function extractSecondFactors(
  factors: Array<{ strategy: string }> | null | undefined,
): SecondFactorStrategy[] {
  const list = factors ?? [];
  const available: SecondFactorStrategy[] = [];
  if (list.some((f) => f.strategy === "totp")) available.push("totp");
  if (list.some((f) => f.strategy === "phone_code")) available.push("phone_code");
  if (list.some((f) => f.strategy === "backup_code")) available.push("backup_code");
  return available.length > 0 ? available : ["totp"];
}

const DEFAULT_SECOND_FACTORS: SecondFactorStrategy[] = ["totp"];

export function CustomSignInForm({ redirectUrl = "/dashboard" }: CustomSignInFormProps) {
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { isLoaded, signIn, setActive } = useSignIn();

  const [mfaStrategy, setMfaStrategy] = React.useState<SecondFactorStrategy>("totp");
  const [mfaCode, setMfaCode] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const lastAutoSubmittedCodeRef = React.useRef<string | null>(null);

  const isOAuthSecondFactor = Boolean(isLoaded && signIn?.status === "needs_second_factor");
  const shouldRedirectSignedIn = Boolean(isAuthLoaded && isSignedIn && !isOAuthSecondFactor);

  React.useEffect(() => {
    if (shouldRedirectSignedIn) {
      window.location.replace(redirectUrl);
    }
  }, [shouldRedirectSignedIn, redirectUrl]);

  const availableSecondFactors = isOAuthSecondFactor
    ? extractSecondFactors(signIn?.supportedSecondFactors)
    : DEFAULT_SECOND_FACTORS;
  const activeMfaStrategy: SecondFactorStrategy = availableSecondFactors.includes(mfaStrategy)
    ? mfaStrategy
    : (availableSecondFactors[0] ?? "totp");

  async function handleGoogleSignIn() {
    if (!isLoaded || !signIn) return;
    setError(null);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `/sso-callback?redirect_url=${encodeURIComponent(redirectUrl)}`,
        redirectUrlComplete: redirectUrl,
      });
    } catch (err) {
      setError(getClerkErrorMessage(err));
    }
  }

  async function submitSecondFactorCode(rawCode: string) {
    if (!isLoaded || !signIn || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const attempt = await signIn.attemptSecondFactor({
        strategy: activeMfaStrategy,
        code: rawCode.trim(),
      });

      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        window.location.assign(redirectUrl);
        return;
      }

      setError("Verification could not be completed. Check your code and try again.");
    } catch (err) {
      setError(getClerkErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifySecondFactor(e: React.FormEvent) {
    e.preventDefault();
    await submitSecondFactorCode(mfaCode);
  }

  if (shouldRedirectSignedIn) {
    return (
      <div className="space-y-2 py-4 text-center">
        <p className="font-serif text-base font-semibold text-ink">You&apos;re signed in</p>
        <p className="text-xs text-mut">Redirecting you to your Servyn account...</p>
      </div>
    );
  }

  if (isOAuthSecondFactor) {
    return (
      <form onSubmit={handleVerifySecondFactor} className="space-y-4">
        <div className="flex items-start gap-2.5 rounded-md border border-gold-200 bg-gold-50 p-3.5 text-xs text-ink-2">
          <Lock className="mt-0.5 size-4 shrink-0 text-gold-600" aria-hidden="true" />
          <p>
            {activeMfaStrategy === "backup_code"
              ? "Enter one of your saved 2FA backup codes."
              : activeMfaStrategy === "phone_code"
                ? "Enter the 6-digit SMS code sent to your phone."
                : "Enter the 6-digit code from your authenticator app."}
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="signin-2fa-code" className="block text-xs font-semibold text-ink-2">
            {activeMfaStrategy === "backup_code" ? "Backup code" : "Verification code"}
          </label>
          <input
            id="signin-2fa-code"
            type="text"
            inputMode={activeMfaStrategy === "backup_code" ? "text" : "numeric"}
            autoComplete="one-time-code"
            required
            maxLength={activeMfaStrategy === "backup_code" ? undefined : 6}
            value={mfaCode}
            onChange={(e) => {
              if (activeMfaStrategy === "backup_code") {
                setMfaCode(e.target.value);
                return;
              }
              const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
              setMfaCode(digits);
              if (digits.length < 6) {
                lastAutoSubmittedCodeRef.current = null;
              } else if (lastAutoSubmittedCodeRef.current !== digits && !isSubmitting) {
                lastAutoSubmittedCodeRef.current = digits;
                void submitSecondFactorCode(digits);
              }
            }}
            placeholder={activeMfaStrategy === "backup_code" ? "XXXX-XXXX" : "000000"}
            className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3.5 py-2.5 text-center text-base font-semibold tracking-[0.2em] text-ink placeholder:text-mut focus:border-gold-500 focus:bg-surface focus:outline-none"
          />
        </div>

        {availableSecondFactors.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {availableSecondFactors.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  lastAutoSubmittedCodeRef.current = null;
                  setMfaStrategy(s);
                  setMfaCode("");
                  if (s === "phone_code" && signIn) {
                    void signIn.prepareSecondFactor({ strategy: "phone_code" });
                  }
                }}
                className={`cursor-pointer rounded-full border px-3 py-1 text-[11px] font-semibold ${
                  activeMfaStrategy === s
                    ? "border-leaf-800 bg-leaf-800 text-cream"
                    : "border-line-2 text-ink-2"
                }`}
              >
                {s === "totp" ? "Authenticator" : s === "phone_code" ? "SMS" : "Backup code"}
              </button>
            ))}
          </div>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="rounded-md bg-blush px-3 py-2 text-xs font-semibold text-blush-d"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || !isLoaded}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-5 py-3 text-sm font-semibold text-gold-ink shadow-gold transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>{isSubmitting ? "Verifying..." : "Verify & sign in"}</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => void handleGoogleSignIn()}
        disabled={!isLoaded}
        className="inline-flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border border-line-2 bg-surface px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-2 disabled:opacity-60"
      >
        <span className="font-serif text-base font-bold text-leaf-800" aria-hidden="true">
          G
        </span>
        <span>Continue with Google</span>
      </button>

      {error ? (
        <p
          role="alert"
          className="rounded-md bg-blush px-3 py-2 text-xs font-semibold text-blush-d"
        >
          {error}
        </p>
      ) : null}

      <p className="pt-1 text-center text-xs text-mut">
        New to Servyn?{" "}
        <Link href="/sign-up" className="font-semibold text-leaf-600 hover:text-leaf-700">
          Create an account
        </Link>
      </p>
    </div>
  );
}
