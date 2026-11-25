"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin } from "lucide-react";

const MANCHESTER_LOCATIONS: ReadonlyArray<{
  label: string;
  postcode: string;
  lat: number;
  lng: number;
}> = [
  { label: "Hulme", postcode: "M15 5NN", lat: 53.4648, lng: -2.2484 },
  { label: "Salford", postcode: "M5 4WT", lat: 53.4875, lng: -2.2901 },
  { label: "Cheetham Hill", postcode: "M8 8EP", lat: 53.5052, lng: -2.2389 },
  { label: "Levenshulme", postcode: "M19 3PJ", lat: 53.4426, lng: -2.1927 },
  { label: "Moss Side", postcode: "M14 4PA", lat: 53.4557, lng: -2.2421 },
  { label: "Chorlton", postcode: "M21 9AN", lat: 53.4408, lng: -2.2725 },
  { label: "City Centre", postcode: "M1 1AE", lat: 53.4808, lng: -2.2426 },
  { label: "Oldham", postcode: "OL1 1AA", lat: 53.5409, lng: -2.1114 },
];

export interface CustomerOnboardingWizardProps {
  defaultDisplayName: string;
  defaultAreaLabel?: string;
  defaultMarketingOptIn: boolean;
}

export function CustomerOnboardingWizard({
  defaultDisplayName,
  defaultAreaLabel = "Hulme",
  defaultMarketingOptIn,
}: CustomerOnboardingWizardProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = React.useState(defaultDisplayName);
  const [selectedArea, setSelectedArea] = React.useState(defaultAreaLabel);
  const [marketingOptIn, setMarketingOptIn] = React.useState(defaultMarketingOptIn);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const loc =
      MANCHESTER_LOCATIONS.find((item) => item.label === selectedArea) ?? MANCHESTER_LOCATIONS[0];

    try {
      const res = await fetch("/api/v1/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim() || "Servyn Member",
          ageConfirmed18Plus: true,
          marketingOptIn,
          defaultLocation: loc
            ? {
                postcode: loc.postcode,
                lat: loc.lat,
                lng: loc.lng,
                label: loc.label,
              }
            : undefined,
        }),
      });

      if (!res.ok) {
        setError("Could not save your preferences. Please try again.");
        setIsSubmitting(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error while saving preferences.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="space-y-1.5">
        <label htmlFor="customer-display-name" className="block text-xs font-semibold text-ink-2">
          Display name
        </label>
        <input
          id="customer-display-name"
          type="text"
          required
          minLength={1}
          maxLength={80}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Ada Okafor"
          className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-mut focus:border-gold-500 focus:bg-surface focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-2">
          <MapPin className="size-3.5 text-gold-600" aria-hidden="true" />
          <span>Preferred Manchester area (optional)</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {MANCHESTER_LOCATIONS.map((loc) => {
            const active = selectedArea === loc.label;
            return (
              <button
                key={loc.label}
                type="button"
                onClick={() => setSelectedArea(loc.label)}
                className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "border-leaf-800 bg-leaf-800 text-cream"
                    : "border-line-2 bg-surface-2 text-ink-2 hover:border-gold-500"
                }`}
              >
                {loc.label}
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-line bg-surface-2 p-3.5 text-xs text-ink-2">
        <input
          type="checkbox"
          checked={marketingOptIn}
          onChange={(e) => setMarketingOptIn(e.target.checked)}
          className="mt-0.5 size-4 rounded accent-leaf-700"
        />
        <span>
          Optional: email me about new Manchester providers, seasonal offers, and African market
          arrivals.
        </span>
      </label>

      {error ? (
        <p
          role="alert"
          className="rounded-md bg-blush px-3 py-2 text-xs font-semibold text-blush-d"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-5 py-3 text-sm font-semibold text-gold-ink shadow-gold transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>{isSubmitting ? "Saving..." : "Save & go to dashboard"}</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>

        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-full border-[1.5px] border-line-2 px-5 py-3 text-sm font-semibold text-ink-2 transition-colors hover:border-leaf-500 hover:bg-leaf-50"
        >
          Skip for now
        </Link>
      </div>
    </form>
  );
}
