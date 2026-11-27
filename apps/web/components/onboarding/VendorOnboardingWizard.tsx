"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Check, ShieldAlert, ShieldCheck } from "lucide-react";
import { TurnstileWidget } from "@/components/observability/TurnstileWidget";

const SERVICE_CATEGORIES = [
  "Hair & beauty",
  "Barbering & grooming",
  "Events & celebrations",
  "Event decoration & styling",
  "Event rentals",
  "DJs & MCs",
  "Catering & food",
  "Cakes & baking",
  "Childcare & family support",
  "Fashion & tailoring",
  "Home services",
  "Other local services",
] as const;

const MANCHESTER_AREAS = [
  "Greater Manchester",
  "Hulme & Moss Side",
  "Salford",
  "Cheetham Hill",
  "Levenshulme",
  "Chorlton & Didsbury",
  "Trafford",
  "Oldham",
] as const;

export interface VendorOnboardingWizardProps {
  defaultBusinessName: string;
  hasMfa: boolean;
}

export function VendorOnboardingWizard({
  defaultBusinessName,
}: VendorOnboardingWizardProps) {
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [businessName, setBusinessName] = React.useState(defaultBusinessName);
  const [category, setCategory] = React.useState<string>("Hair & beauty");
  const [bio, setBio] = React.useState("");
  const [serviceArea, setServiceArea] = React.useState<string>("Greater Manchester");
  const [bookingModel, setBookingModel] = React.useState<"request" | "instant" | "quote">(
    "request",
  );
  const [ageConfirmed, setAgeConfirmed] = React.useState(false);
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [turnstileToken, setTurnstileToken] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isChildcare = category === "Childcare & family support";

  function handleNextStep() {
    setError(null);
    if (step === 1 && businessName.trim().length < 2) {
      setError("Please enter a business or trading name (at least 2 characters).");
      return;
    }
    setStep((prev) => (prev === 1 ? 2 : 3));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ageConfirmed || !termsAccepted) {
      setError("Please confirm you are 18+ and accept Servyn's vendor terms to continue.");
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
        `Area: ${serviceArea}`,
        `Model: ${bookingModel}`,
      ]
        .filter(Boolean)
        .join(" · ")
        .slice(0, 500);

      const res = await fetch("/api/v1/me/become-vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
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
        setError(data?.error?.message ?? "Could not activate vendor profile.");
        setIsSubmitting(false);
        return;
      }

      window.location.assign("/vendor");
    } catch {
      setError("Network error while activating vendor profile.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 3-step indicator */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { num: 1, label: "Business profile" },
          { num: 2, label: "Area & booking" },
          { num: 3, label: "Review & publish" },
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
              htmlFor="vendor-business-name"
              className="block text-xs font-semibold text-ink-2"
            >
              Business or trading name
            </label>
            <input
              id="vendor-business-name"
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Amara Braids Manchester"
              className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-mut focus:border-gold-500 focus:bg-surface focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="vendor-category" className="block text-xs font-semibold text-ink-2">
              Primary service category
            </label>
            <select
              id="vendor-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3.5 py-2.5 text-sm font-medium text-ink focus:border-gold-500 focus:bg-surface focus:outline-none"
            >
              {SERVICE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {isChildcare ? (
            <div className="flex items-start gap-2.5 rounded-md border border-gold-300 bg-gold-50 p-3.5 text-xs leading-relaxed text-ink-2">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-gold-600" aria-hidden="true" />
              <p>
                <strong>Childcare enhanced tier:</strong> Requires ID verification, current DBS
                check, qualifications, and references before listings go live. Servyn verifies ID
                and current DBS documents and does not certify suitability.
              </p>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label htmlFor="vendor-bio" className="block text-xs font-semibold text-ink-2">
              Short service description (optional)
            </label>
            <textarea
              id="vendor-bio"
              rows={3}
              maxLength={300}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell Manchester customers what you specialise in..."
              className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-mut focus:border-gold-500 focus:bg-surface focus:outline-none"
            />
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-ink-2">Primary service area</span>
            <div className="flex flex-wrap gap-2">
              {MANCHESTER_AREAS.map((area) => {
                const active = serviceArea === area;
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setServiceArea(area)}
                    className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? "border-leaf-800 bg-leaf-800 text-cream"
                        : "border-line-2 bg-surface-2 text-ink-2 hover:border-gold-500"
                    }`}
                  >
                    {area}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <span className="block text-xs font-semibold text-ink-2">Preferred booking model</span>
            <div className="space-y-2">
              {[
                {
                  id: "request" as const,
                  title: "Request & accept (recommended)",
                  desc: "Review each booking request before confirming.",
                },
                {
                  id: "instant" as const,
                  title: "Instant book",
                  desc: "Customers book open calendar slots immediately.",
                },
                {
                  id: "quote" as const,
                  title: "Custom quotes",
                  desc: "Ideal for events, catering, decoration, and bespoke work.",
                },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setBookingModel(m.id)}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-md border p-3 text-left ${
                    bookingModel === m.id
                      ? "border-gold-500 bg-gold-50"
                      : "border-line bg-surface-2"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{m.title}</p>
                    <p className="text-xs text-mut">{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-md border border-line bg-surface-2 p-4 text-xs leading-relaxed text-ink-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-leaf-600" aria-hidden="true" />
            <div>
              <p className="font-semibold text-ink">
                Ready to activate your vendor dashboard
              </p>
              <p className="mt-0.5 text-mut">
                You can list services, manage availability, and receive Stripe-held protected payouts
                immediately. Optional 2FA can be enabled anytime in Account Security.
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
                I accept Servyn&apos;s Vendor Terms, Cancellation Policy, and Protected Payment
                rules.
              </span>
            </label>
          </div>

          <TurnstileWidget action="become_vendor" onToken={setTurnstileToken} />
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
          <div />
        )}

        {step < 3 ? (
          <button
            key="vendor-next-step"
            type="button"
            onClick={handleNextStep}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-leaf-800 px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-leaf-700"
          >
            <span>Next step</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        ) : (
          <button
            key="vendor-submit-wizard"
            type="submit"
            disabled={isSubmitting}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-6 py-2.5 text-sm font-semibold text-gold-ink shadow-gold transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span>{isSubmitting ? "Activating..." : "Activate vendor profile"}</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </form>
  );
}
