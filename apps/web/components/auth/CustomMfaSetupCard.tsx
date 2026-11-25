"use client";

import * as React from "react";
import { SignOutButton, useReverification, useSession, useUser } from "@clerk/nextjs";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  Lock,
  QrCode,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { ReverificationDialog, type ReverificationRequest } from "./ReverificationDialog";

export interface CustomMfaSetupCardProps {
  redirectUrl: string;
}

interface ClerkErrorInfo {
  code: string | null;
  message: string;
}

function extractClerkError(err: unknown): ClerkErrorInfo {
  if (typeof err === "object" && err !== null) {
    if ("errors" in err && Array.isArray(err.errors) && err.errors.length > 0) {
      const first: unknown = err.errors[0];
      if (typeof first === "object" && first !== null) {
        const code = "code" in first && typeof first.code === "string" ? first.code : null;
        const longMessage =
          "longMessage" in first && typeof first.longMessage === "string"
            ? first.longMessage
            : null;
        const message =
          "message" in first && typeof first.message === "string" ? first.message : null;
        return {
          code,
          message: longMessage ?? message ?? "Could not complete operation. Please try again.",
        };
      }
    }

    const topCode = "code" in err && typeof err.code === "string" ? err.code : null;
    const topMessage = "message" in err && typeof err.message === "string" ? err.message : null;
    if (topCode || topMessage) {
      return {
        code: topCode,
        message: topMessage ?? "Could not complete operation. Please try again.",
      };
    }
  }

  return {
    code: null,
    message: "Could not complete operation. Please try again.",
  };
}

export function CustomMfaSetupCard({ redirectUrl }: CustomMfaSetupCardProps) {
  const { isLoaded, user } = useUser();
  const { session } = useSession();

  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [totpSecret, setTotpSecret] = React.useState<string | null>(null);
  const [totpUri, setTotpUri] = React.useState<string | null>(null);
  const [showManualKey, setShowManualKey] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [backupCodes, setBackupCodes] = React.useState<string[]>([]);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [errorState, setErrorState] = React.useState<ClerkErrorInfo | null>(null);
  const [reverificationRequest, setReverificationRequest] =
    React.useState<ReverificationRequest | null>(null);
  const [sessionMfaStrategy, setSessionMfaStrategy] = React.useState<"totp" | "backup_code">(
    "totp",
  );
  const [sessionMfaCode, setSessionMfaCode] = React.useState("");
  const [isVerifyingSession, setIsVerifyingSession] = React.useState(false);

  const attemptedUserIdRef = React.useRef<string | null>(null);
  const inFlightRef = React.useRef(false);
  const lastAutoSubmittedCodeRef = React.useRef<string | null>(null);
  const lastAutoSubmittedSessionCodeRef = React.useRef<string | null>(null);

  // Clerk's reverification hook intercepts sensitive action step-up prompts with our custom dialog
  const createTotpWithReverification = useReverification(
    async () => {
      if (!user) return null;
      return user.createTOTP();
    },
    {
      onNeedsReverification: ({ complete, cancel, level }) => {
        setReverificationRequest({ level, complete, cancel });
      },
    },
  );

  const verifyTotpWithReverification = useReverification(
    async (totpCode: string) => {
      if (!user) return null;
      return user.verifyTOTP({ code: totpCode });
    },
    {
      onNeedsReverification: ({ complete, cancel, level }) => {
        setReverificationRequest({ level, complete, cancel });
      },
    },
  );

  const handleGenerateKey = React.useCallback(async () => {
    if (!user || totpSecret || inFlightRef.current) return;
    inFlightRef.current = true;
    setErrorState(null);
    setIsGenerating(true);
    try {
      const res = await createTotpWithReverification();
      if (res?.secret) {
        setTotpSecret(res.secret);
        const fallbackEmail = user.primaryEmailAddress?.emailAddress ?? "account";
        const uri =
          res.uri ??
          `otpauth://totp/Servyn:${encodeURIComponent(fallbackEmail)}?secret=${res.secret}&issuer=Servyn`;
        setTotpUri(uri);
      } else {
        setErrorState({
          code: null,
          message: "Could not generate a setup key. Please try again.",
        });
      }
    } catch (err) {
      setErrorState(extractClerkError(err));
    } finally {
      inFlightRef.current = false;
      setIsGenerating(false);
    }
  }, [user, totpSecret, createTotpWithReverification]);

  const userId = user?.id ?? null;
  const twoFactorEnabled = user?.twoFactorEnabled ?? false;

  // Attempt initial generation at most once per mounted user ID
  React.useEffect(() => {
    if (!isLoaded || !userId || twoFactorEnabled || totpSecret) return;
    if (attemptedUserIdRef.current === userId) return;
    attemptedUserIdRef.current = userId;
    void handleGenerateKey();
  }, [isLoaded, userId, twoFactorEnabled, totpSecret, handleGenerateKey]);

  async function handleCopySecret() {
    if (!totpSecret) return;
    try {
      await navigator.clipboard.writeText(totpSecret);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function submitTotpCode(rawCode: string) {
    if (!user || isVerifying) return;
    setErrorState(null);
    setIsVerifying(true);

    try {
      const verified = await verifyTotpWithReverification(rawCode.trim());
      if (!verified) {
        setErrorState({
          code: null,
          message: "Could not verify your code. Please try again.",
        });
        return;
      }

      const codes = verified.backupCodes ?? [];
      await user.reload();

      let enrolledRes = await fetch("/api/v1/auth/mfa-enrolled", { method: "POST" });
      if (enrolledRes.status === 403) {
        await new Promise((resolve) => window.setTimeout(resolve, 400));
        enrolledRes = await fetch("/api/v1/auth/mfa-enrolled", { method: "POST" });
      }

      if (!enrolledRes.ok) {
        const errBody: unknown = await enrolledRes.json().catch(() => null);
        let message = "2FA was enabled, but we could not confirm your session. Please try again.";
        if (
          typeof errBody === "object" &&
          errBody !== null &&
          "error" in errBody &&
          typeof errBody.error === "object" &&
          errBody.error !== null &&
          "message" in errBody.error &&
          typeof errBody.error.message === "string"
        ) {
          message = errBody.error.message;
        }
        setErrorState({ code: null, message });
        return;
      }

      await Promise.allSettled([session?.touch(), session?.getToken({ skipCache: true })]);
      setBackupCodes(codes);
      setStep(3);
    } catch (err) {
      setErrorState(extractClerkError(err));
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    await submitTotpCode(code);
  }

  if (!isLoaded) {
    return (
      <div className="space-y-3 py-4">
        <div className="h-10 rounded-md bg-surface-2" />
        <div className="h-24 rounded-md bg-surface-2" />
      </div>
    );
  }

  async function submitSessionSecondFactor(rawCode: string) {
    if (!session || isVerifyingSession) return;
    setErrorState(null);
    setIsVerifyingSession(true);

    try {
      const started = await session.startVerification({ level: "second_factor" });
      if (started.status !== "complete") {
        const result =
          sessionMfaStrategy === "backup_code"
            ? await session.attemptSecondFactorVerification({
                strategy: "backup_code",
                code: rawCode.trim(),
              })
            : await session.attemptSecondFactorVerification({
                strategy: "totp",
                code: rawCode.trim(),
              });

        if (result.status !== "complete") {
          setErrorState({
            code: null,
            message: "Verification could not be completed. Check your code and try again.",
          });
          return;
        }
      }

      await Promise.allSettled([session.touch(), session.getToken({ skipCache: true })]);
      window.location.assign(redirectUrl);
    } catch (err) {
      setErrorState(extractClerkError(err));
    } finally {
      setIsVerifyingSession(false);
    }
  }

  async function handleSessionSecondFactorSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submitSessionSecondFactor(sessionMfaCode);
  }

  if (user?.twoFactorEnabled && step !== 3) {
    return (
      <form onSubmit={handleSessionSecondFactorSubmit} className="space-y-5">
        <div className="flex items-start gap-3 rounded-md border border-leaf-200 bg-leaf-50 p-4 text-xs leading-relaxed text-ink-2">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-leaf-600" aria-hidden="true" />
          <div>
            <p className="font-semibold text-ink">Confirm your 2FA code to continue</p>
            <p className="mt-0.5 text-mut">
              {sessionMfaStrategy === "backup_code"
                ? "Enter one of your saved 2FA backup codes to verify this browser session."
                : "2FA is enabled on your account. Enter the 6-digit code from your authenticator app to unlock vendor & seller tools."}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="session-mfa-code" className="block text-xs font-semibold text-ink-2">
            {sessionMfaStrategy === "backup_code" ? "Backup code" : "Authenticator code"}
          </label>
          <input
            id="session-mfa-code"
            type="text"
            inputMode={sessionMfaStrategy === "backup_code" ? "text" : "numeric"}
            autoComplete="one-time-code"
            required
            maxLength={sessionMfaStrategy === "backup_code" ? undefined : 6}
            value={sessionMfaCode}
            onChange={(e) => {
              if (sessionMfaStrategy === "backup_code") {
                setSessionMfaCode(e.target.value);
                return;
              }
              const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
              setSessionMfaCode(digits);
              if (digits.length < 6) {
                lastAutoSubmittedSessionCodeRef.current = null;
              } else if (
                lastAutoSubmittedSessionCodeRef.current !== digits &&
                !isVerifyingSession
              ) {
                lastAutoSubmittedSessionCodeRef.current = digits;
                void submitSessionSecondFactor(digits);
              }
            }}
            placeholder={sessionMfaStrategy === "backup_code" ? "XXXX-XXXX" : "000000"}
            className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3.5 py-3 text-center text-lg font-semibold tracking-[0.3em] tabular-nums text-ink placeholder:text-mut focus:border-gold-500 focus:bg-surface focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(["totp", "backup_code"] as const).map((strategy) => (
            <button
              key={strategy}
              type="button"
              onClick={() => {
                lastAutoSubmittedSessionCodeRef.current = null;
                setSessionMfaStrategy(strategy);
                setSessionMfaCode("");
                setErrorState(null);
              }}
              className={`cursor-pointer rounded-full border px-3 py-1 text-[11px] font-semibold ${
                sessionMfaStrategy === strategy
                  ? "border-leaf-800 bg-leaf-800 text-cream"
                  : "border-line-2 text-ink-2"
              }`}
            >
              {strategy === "totp" ? "Authenticator" : "Backup code"}
            </button>
          ))}
        </div>

        {errorState ? (
          <p
            role="alert"
            className="rounded-md bg-blush px-3 py-2 text-xs font-semibold text-blush-d"
          >
            {errorState.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isVerifyingSession || !session}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-5 py-3 text-sm font-semibold text-gold-ink shadow-gold transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>{isVerifyingSession ? "Verifying..." : "Verify & continue"}</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>

        <div className="text-center">
          <SignOutButton redirectUrl={`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`}>
            <button
              type="button"
              className="cursor-pointer text-xs font-semibold text-leaf-600 hover:text-leaf-700"
            >
              Sign out &amp; switch account
            </button>
          </SignOutButton>
        </div>
      </form>
    );
  }

  const isReverificationRequired = Boolean(
    errorState &&
    (errorState.code === "session_reverification_required" ||
      errorState.code === "reverification_cancelled" ||
      (!errorState.code &&
        (errorState.message.toLowerCase().includes("additional verification") ||
          errorState.message.toLowerCase().includes("reverification") ||
          errorState.message.toLowerCase().includes("re-verif") ||
          errorState.message.toLowerCase().includes("step-up")))),
  );

  const formattedSecret = totpSecret
    ? (totpSecret.match(/.{1,4}/g)?.join(" ") ?? totpSecret)
    : null;

  return (
    <div className="space-y-5">
      {/* 3-step indicator */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
        {[
          { num: 1, label: "Add key" },
          { num: 2, label: "Verify code" },
          { num: 3, label: "Backup codes" },
        ].map((item) => {
          const done = step > item.num;
          const active = step === item.num;
          return (
            <div
              key={item.num}
              className={`rounded-md border px-2 py-2 ${
                active
                  ? "border-gold-500 bg-gold-50 text-ink"
                  : done
                    ? "border-leaf-200 bg-leaf-50 text-leaf-700"
                    : "border-line bg-surface-2 text-mut"
              }`}
            >
              {item.num}. {item.label}
            </div>
          );
        })}
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          {/* Reverification step-up requirement state */}
          {isReverificationRequired && !totpSecret ? (
            <div className="space-y-3 rounded-md border border-gold-300 bg-gold-50 p-4 text-xs text-ink-2">
              <div className="flex items-start gap-2.5">
                <Lock className="mt-0.5 size-4 shrink-0 text-gold-700" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-ink">Session re-verification required</p>
                  <p className="mt-1 leading-relaxed text-mut">
                    Because Two-Factor Authentication protects vendor payouts and customer data,
                    Clerk requires fresh identity confirmation before generating your setup key.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleGenerateKey()}
                disabled={isGenerating}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-4 py-2.5 text-xs font-semibold text-gold-ink shadow-gold transition-all hover:brightness-105 disabled:opacity-50"
              >
                <KeyRound className="size-3.5" aria-hidden="true" />
                <span>
                  {isGenerating ? "Confirming identity..." : "Confirm identity & generate key"}
                </span>
              </button>

              <div className="pt-1 text-center">
                <SignOutButton
                  redirectUrl={`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`}
                >
                  <button
                    type="button"
                    className="cursor-pointer text-[11px] font-semibold text-leaf-700 hover:text-leaf-800"
                  >
                    Or sign out and sign back in to refresh session
                  </button>
                </SignOutButton>
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-leaf-900 p-4 text-cream">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.1em] uppercase text-gold-300">
                  <QrCode className="size-3.5" aria-hidden="true" />
                  <span>Scan authenticator QR code</span>
                </span>
                {totpSecret ? (
                  <button
                    type="button"
                    onClick={() => setShowManualKey((prev) => !prev)}
                    className="cursor-pointer text-[11px] font-semibold text-gold-300 underline underline-offset-2 hover:text-cream"
                  >
                    {showManualKey ? "Hide setup key" : "Use setup key"}
                  </button>
                ) : null}
              </div>

              <div className="mt-4 flex justify-center">
                {totpUri ? (
                  <div className="rounded-md bg-surface p-3.5 shadow-soft">
                    <QRCodeSVG
                      value={totpUri}
                      size={176}
                      level="M"
                      bgColor="var(--sv-surface)"
                      fgColor="var(--sv-leaf-900)"
                      title="Authenticator app QR code"
                    />
                  </div>
                ) : (
                  <div className="flex size-[204px] items-center justify-center rounded-md border border-cream-line bg-leaf-950/50 px-4 text-center text-xs font-medium text-cream-75">
                    {isGenerating
                      ? "Generating QR code..."
                      : !errorState
                        ? "Generating QR code..."
                        : "Unable to generate QR code"}
                  </div>
                )}
              </div>

              <p className="mt-3 text-center text-xs leading-relaxed text-cream-75">
                Scan this QR code with Google Authenticator, Apple Passwords, 1Password, or Authy.
              </p>

              {showManualKey && formattedSecret ? (
                <div className="mt-3 rounded-sm border border-cream-line bg-leaf-950/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-cream-75">
                      Manual setup key
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleCopySecret()}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-cream-line bg-cream/10 px-2.5 py-0.5 text-[11px] font-semibold text-cream hover:bg-cream/20"
                    >
                      {copied ? (
                        <>
                          <Check className="size-3 text-gold-300" aria-hidden="true" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" aria-hidden="true" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mt-1.5 break-all text-sm font-semibold tracking-[0.14em] tabular-nums text-gold-300">
                    {formattedSecret}
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {errorState && !isReverificationRequired ? (
            <div className="space-y-2">
              <p
                role="alert"
                className="rounded-md bg-blush px-3 py-2 text-xs font-semibold text-blush-d"
              >
                {errorState.message}
              </p>
              <button
                type="button"
                onClick={() => void handleGenerateKey()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-leaf-600 hover:text-leaf-700"
              >
                <RefreshCw className="size-3" aria-hidden="true" />
                <span>Retry generating key</span>
              </button>
            </div>
          ) : null}

          <button
            type="button"
            disabled={!totpSecret}
            onClick={() => setStep(2)}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-5 py-3 text-sm font-semibold text-gold-ink shadow-gold transition-all hover:brightness-105 disabled:opacity-50"
          >
            <span>I&apos;ve added it — verify a code</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {step === 2 ? (
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="mfa-totp-code" className="block text-xs font-semibold text-ink-2">
              Enter the 6-digit code from your authenticator app
            </label>
            <input
              id="mfa-totp-code"
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
                } else if (lastAutoSubmittedCodeRef.current !== digits && !isVerifying) {
                  lastAutoSubmittedCodeRef.current = digits;
                  void submitTotpCode(digits);
                }
              }}
              placeholder="000000"
              className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3.5 py-3 text-center text-lg font-semibold tracking-[0.3em] text-ink placeholder:text-mut focus:border-gold-500 focus:bg-surface focus:outline-none"
            />
          </div>

          {errorState ? (
            <p
              role="alert"
              className="rounded-md bg-blush px-3 py-2 text-xs font-semibold text-blush-d"
            >
              {errorState.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isVerifying}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-5 py-3 text-sm font-semibold text-gold-ink shadow-gold transition-all hover:brightness-105 disabled:opacity-60"
          >
            <span>{isVerifying ? "Verifying..." : "Verify & enable 2FA"}</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full cursor-pointer text-center text-xs font-medium text-mut hover:text-ink"
          >
            ← Back to QR code
          </button>
        </form>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4 text-center">
          <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-mint text-mint-d">
            <CheckCircle2 className="size-6" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-serif text-xl font-semibold text-ink">2FA is on</h2>
            <p className="mt-1 text-xs text-mut">
              Save your backup codes somewhere safe — each works once if you lose your
              authenticator.
            </p>
          </div>

          {backupCodes.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 text-left">
              {backupCodes.map((bCode) => (
                <div
                  key={bCode}
                  className="rounded-sm border border-line bg-surface-2 px-3 py-2 text-center text-xs font-semibold tracking-[0.08em] text-ink"
                >
                  {bCode}
                </div>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => window.location.assign(redirectUrl)}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-5 py-3 text-sm font-semibold text-gold-ink shadow-gold transition-all hover:brightness-105"
          >
            <span>
              {redirectUrl.startsWith("/onboarding")
                ? "Continue to onboarding"
                : "Continue to dashboard"}
            </span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <ReverificationDialog
        request={reverificationRequest}
        onClose={() => setReverificationRequest(null)}
      />
    </div>
  );
}
