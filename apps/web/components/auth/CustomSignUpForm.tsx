"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useSignUp } from "@clerk/nextjs/legacy";

export interface CustomSignUpFormProps {
  redirectTo: string;
}

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
  return "Could not create your account. Please try again.";
}

export function CustomSignUpForm({ redirectTo }: CustomSignUpFormProps) {
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { isLoaded, signUp } = useSignUp();

  const [error, setError] = React.useState<string | null>(null);

  const shouldRedirectSignedIn = Boolean(isAuthLoaded && isSignedIn);

  React.useEffect(() => {
    if (shouldRedirectSignedIn) {
      window.location.replace(redirectTo);
    }
  }, [shouldRedirectSignedIn, redirectTo]);

  async function handleGoogleSignUp() {
    if (!isLoaded || !signUp) return;
    setError(null);
    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `/sso-callback?redirect_url=${encodeURIComponent(redirectTo)}`,
        redirectUrlComplete: redirectTo,
      });
    } catch (err) {
      setError(getClerkErrorMessage(err));
    }
  }

  if (shouldRedirectSignedIn) {
    return (
      <div className="space-y-2 py-4 text-center">
        <p className="font-serif text-base font-semibold text-ink">You&apos;re signed in</p>
        <p className="text-xs text-mut">Redirecting you to your Servyn account...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => void handleGoogleSignUp()}
        disabled={!isLoaded}
        className="inline-flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border border-line-2 bg-surface px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-2 disabled:opacity-60"
      >
        <span className="font-serif text-base font-bold text-leaf-800" aria-hidden="true">
          G
        </span>
        <span>Continue with Google</span>
      </button>

      <div id="clerk-captcha" />

      {error ? (
        <p
          role="alert"
          className="rounded-md bg-blush px-3 py-2 text-xs font-semibold text-blush-d"
        >
          {error}
        </p>
      ) : null}

      <p className="pt-1 text-center text-xs text-mut">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-leaf-600 hover:text-leaf-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
