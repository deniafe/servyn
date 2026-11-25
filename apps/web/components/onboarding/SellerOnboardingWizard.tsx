"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Check, Lock, ShieldCheck, Store } from "lucide-react";
import { TurnstileWidget } from "@/components/observability/TurnstileWidget";

const PRODUCT_CATEGORIES = [
  "African food & pantry",
  "Fashion & fabrics",
  "Beauty & hair care",
  "Crafts & homeware",
  "Gifts & cultural items",
] as const;

export interface SellerOnboardingWizardProps {
  defaultStorefrontName: string;
  hasMfa: boolean;
}

export function SellerOnboardingWizard({
  defaultStorefrontName,
  hasMfa,
}: SellerOnboardingWizardProps) {
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [storefrontName, setStorefrontName] = React.useState(defaultStorefrontName);
  const [category, setCategory] = React.useState<string>("African food & pantry");
  const [bio, setBio] = React.useState("");
  const [offersBulk, setOffersBulk] = React.useState(true);
  const [dispatchWindow, setDispatchWindow] = React.useState("1–2 working days (UK)");
  const [ageConfirmed, setAgeConfirmed] = React.useState(false);
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [turnstileToken, setTurnstileToken] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function handleNextStep() {
    setError(null);
    if (step === 1 && storefrontName.trim().length < 2) {
      setError("Please enter a storefront name (at least 2 characters).");
      return;
    }
    setStep((prev) => (prev === 1 ? 2 : 3));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ageConfirmed || !termsAccepted) {
      setError("Please confirm you are 18+ and accept Servyn's seller rules to continue.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const meRes = await fetch("/api/v1/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ageConfirmed18Plus: true }),
      });

      if (!meRes.ok) {
        setError("Could not save your age confirmation. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const summary = [
        bio.trim(),
        `Category: ${category}`,
        `Dispatch: ${dispatchWindow}`,
        offersBulk ? "Retail & Bulk" : "Retail only",
      ]
        .filter(Boolean)
        .join(" · ")
        .slice(0, 500);

      const res = await fetch("/api/v1/me/become-seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: storefrontName.trim(),
          description: summary,
          turnstileToken: turnstileToken ?? undefined,
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        ok: boolean;
        requiresMfa?: boolean;
        error?: { message?: string };
      } | null;

      if (!res.ok || !data?.ok) {
        setError(data?.error?.message ?? "Could not activate seller storefront.");
        setIsSubmitting(false);
        return;
      }

      const target =
        data.requiresMfa || !hasMfa
          ? `/mfa-required?redirect_url=${encodeURIComponent("/seller")}`
          : "/seller";
      window.location.assign(target);
    } catch {
      setError("Network error while activating seller storefront.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-3 gap-2">
        {[
          { num: 1, label: "Storefront" },
          { num: 2, label: "Fulfilment & bulk" },
          { num: 3, label: "2FA & publish" },
        ].map((item) => {
          const done = step > item.num;
          const active = step === item.num;
          return (
            <div
              key={item.num}
              className={`rounded-md border px-3 py-2 text-xs font-semibold ${
                active
                  ? "border-gold-500 bg-gold-50 text-ink"
                  : done
                    ? "border-leaf-200 bg-leaf-50 text-leaf-700"
                    : "border-line bg-surface-2 text-mut"
              }`}
            >
              <span className="mr-1.5 inline-flex size-4 items-center justify-center rounded-full bg-leaf-900 text-[10px] font-bold text-gold-300">
                {done ? <Check className="size-2.5" aria-hidden="true" /> : item.num}
              </span>
              {item.label}
            </div>
          );
        })}
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="seller-storefront-name"
              className="block text-xs font-semibold text-ink-2"
            >
              Storefront name
            </label>
            <input
              id="seller-storefront-name"
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={storefrontName}
              onChange={(e) => setStorefrontName(e.target.value)}
              placeholder="e.g. Eko Pantry UK"
              className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-mut focus:border-gold-500 focus:bg-surface focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="seller-category" className="block text-xs font-semibold text-ink-2">
              Primary product category
            </label>
            <select
              id="seller-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3.5 py-2.5 text-sm font-medium text-ink focus:border-gold-500 focus:bg-surface focus:outline-none"
            >
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="seller-bio" className="block text-xs font-semibold text-ink-2">
              About your products (optional)
            </label>
            <textarea
              id="seller-bio"
              rows={3}
              maxLength={300}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell buyers about your range, sourcing, and heritage..."
              className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-mut focus:border-gold-500 focus:bg-surface focus:outline-none"
            />
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="seller-dispatch" className="block text-xs font-semibold text-ink-2">
              Typical UK dispatch window
            </label>
            <select
              id="seller-dispatch"
              value={dispatchWindow}
              onChange={(e) => setDispatchWindow(e.target.value)}
              className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3.5 py-2.5 text-sm font-medium text-ink focus:border-gold-500 focus:bg-surface focus:outline-none"
            >
              <option value="Same-day Manchester / 1–2 days UK">
                Same-day Manchester / 1–2 days UK
              </option>
              <option value="1–2 working days (UK)">1–2 working days (UK)</option>
              <option value="3–5 working days (made to order)">
                3–5 working days (made to order)
              </option>
            </select>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-line bg-surface-2 p-4">
            <input
              type="checkbox"
              checked={offersBulk}
              onChange={(e) => setOffersBulk(e.target.checked)}
              className="mt-0.5 size-4 rounded accent-leaf-700"
            />
            <div>
              <p className="text-sm font-semibold text-ink">
                Enable bulk &amp; wholesale enquiries
              </p>
              <p className="mt-0.5 text-xs text-mut">
                Allow caterers, event planners, and households to request wholesale pricing tiers.
              </p>
            </div>
          </label>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-md border border-line bg-surface-2 p-4 text-xs leading-relaxed text-ink-2">
            {hasMfa ? (
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-leaf-600" aria-hidden="true" />
            ) : (
              <Lock className="mt-0.5 size-4 shrink-0 text-gold-600" aria-hidden="true" />
            )}
            <div>
              <p className="font-semibold text-ink">
                {hasMfa
                  ? "Two-factor authentication is active on your session"
                  : "Next step after saving: enable 2FA"}
              </p>
              <p className="mt-0.5 text-mut">
                Seller storefronts use release-on-fulfilment payments and require 2FA plus UK
                consumer-rights compliance.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-ink-2">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-0.5 size-4 rounded accent-leaf-700"
              />
              <span>I confirm I am 18 years or older.</span>
            </label>
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 size-4 rounded accent-leaf-700"
              />
              <span>
                I accept Servyn&apos;s Seller Marketplace Rules, UK Returns Policy, and Prohibited
                Listings Policy.
              </span>
            </label>
          </div>

          <TurnstileWidget action="become_seller" onToken={setTurnstileToken} />
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

      <div className="flex items-center justify-between gap-3 pt-2">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep((prev) => (prev === 3 ? 2 : 1))}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-line-2 px-4 py-2.5 text-xs font-semibold text-ink-2 hover:border-leaf-500 hover:bg-leaf-50"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            <span>Back</span>
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 text-xs text-mut">
            <Store className="size-3.5 text-gold-600" aria-hidden="true" />
            <span>One Servyn account</span>
          </div>
        )}

        {step < 3 ? (
          <button
            key="seller-next-step"
            type="button"
            onClick={handleNextStep}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-leaf-800 px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-leaf-700"
          >
            <span>Next step</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        ) : (
          <button
            key="seller-submit-wizard"
            type="submit"
            disabled={isSubmitting}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-6 py-2.5 text-sm font-semibold text-gold-ink shadow-gold transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span>{isSubmitting ? "Activating..." : "Activate seller storefront"}</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </form>
  );
}
