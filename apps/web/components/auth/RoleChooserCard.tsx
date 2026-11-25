"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Scissors, ShieldCheck, Store, User } from "lucide-react";

type RoleChoice = "customer" | "vendor" | "seller";

export interface RoleChooserCardProps {
  defaultIntent?: RoleChoice;
}

const ROLE_OPTIONS: ReadonlyArray<{
  id: RoleChoice;
  title: string;
  description: string;
  pill: string;
  icon: typeof User;
}> = [
  {
    id: "customer",
    title: "Customer",
    description: "Book trusted services & shop the African market.",
    pill: "Recommended",
    icon: User,
  },
  {
    id: "vendor",
    title: "Service vendor",
    description: "Offer services — braiding, childcare, events, home & more.",
    pill: "2FA Required",
    icon: Scissors,
  },
  {
    id: "seller",
    title: "Product seller",
    description: "Sell African products, retail & bulk.",
    pill: "2FA Required",
    icon: Store,
  },
];

export function RoleChooserCard({ defaultIntent = "customer" }: RoleChooserCardProps) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<RoleChoice>(defaultIntent);
  const [ageConfirmed, setAgeConfirmed] = React.useState(false);
  const [marketingOptIn, setMarketingOptIn] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ageConfirmed) {
      setError("Please confirm you are 18 or over to continue.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const prefRes = await fetch("/api/v1/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ageConfirmed18Plus: true,
          marketingOptIn,
        }),
      });

      if (!prefRes.ok) {
        setError("Could not save your consent preferences. Please try again.");
        setIsSubmitting(false);
        return;
      }

      router.push(`/onboarding/${selected}`);
      router.refresh();
    } catch {
      setError("Network error while saving your choice. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2.5" role="radiogroup" aria-label="Choose how you will use Servyn">
        {ROLE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelected(opt.id)}
              className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-md border p-3.5 text-left transition-all ${
                isSelected
                  ? "border-gold-500 bg-gold-50 shadow-soft"
                  : "border-line bg-surface hover:border-line-2"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-leaf-900 text-gold-300">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{opt.title}</p>
                  <p className="text-xs text-mut">{opt.description}</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2.5">
                <span className="rounded-full border border-gold-300 bg-gold-100 px-2.5 py-0.5 text-[11px] font-bold text-butter-d">
                  {opt.pill}
                </span>
                <span
                  className={`flex size-5 items-center justify-center rounded-full border ${
                    isSelected
                      ? "border-leaf-700 bg-leaf-700 text-cream"
                      : "border-line-2 bg-surface"
                  }`}
                >
                  {isSelected ? <Check className="size-3" aria-hidden="true" /> : null}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-start gap-2 rounded-md border border-line bg-surface-2 p-3 text-xs leading-relaxed text-mut">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-leaf-600" aria-hidden="true" />
        <p>
          Vendor and seller roles require identity verification and two-factor authentication before
          payouts unlock. Childcare adds enhanced DBS, first-aid and reference checks. Servyn
          verifies ID and current DBS documents and does not certify suitability.
        </p>
      </div>

      <div className="space-y-2 pt-1 text-xs text-ink-2">
        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={ageConfirmed}
            onChange={(e) => setAgeConfirmed(e.target.checked)}
            className="mt-0.5 size-4 rounded accent-leaf-700"
          />
          <span>
            I confirm I am 18 years or older and accept Servyn&apos;s terms &amp; privacy policy.
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-2.5 text-mut">
          <input
            type="checkbox"
            checked={marketingOptIn}
            onChange={(e) => setMarketingOptIn(e.target.checked)}
            className="mt-0.5 size-4 rounded accent-leaf-700"
          />
          <span>Optional: send me Manchester community updates and early-adopter offers.</span>
        </label>
      </div>

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
        disabled={isSubmitting}
        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-5 py-3 text-sm font-semibold text-gold-ink shadow-gold transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span>{isSubmitting ? "Saving..." : "Continue to setup"}</span>
        <ArrowRight className="size-4" aria-hidden="true" />
      </button>
    </form>
  );
}
