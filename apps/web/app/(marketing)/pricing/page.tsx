import Link from "next/link";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";

const PLANS = [
  {
    name: "Starter",
    price: "£0",
    cadence: "forever to list",
    feeBadge: "10% added on top of your price",
    highlight: false,
    features: [
      "Unlimited service & product listings",
      "Verified provider badge after ID check",
      "Built-in negotiation chat & invoice builder",
      "Stripe protected payments (you keep 100%)",
      "Downloadable UK GDPR & accountant PDF records",
    ],
    ctaLabel: "List your business free",
    ctaHref: "/sign-up?intent=vendor",
  },
  {
    name: "Early Adopter (Manchester)",
    price: "£0",
    cadence: "launch cohort · fee waiver",
    feeBadge: "Reduced platform fee during launch",
    highlight: true,
    features: [
      "Everything in Starter",
      "Priority placement in AI Match & Manchester search",
      "Zero monthly subscription fees",
      "Retail + bulk wholesale product storefront",
      "Dedicated Manchester onboarding support",
    ],
    ctaLabel: "Claim Manchester spot",
    ctaHref: "/sign-up?intent=vendor",
  },
  {
    name: "Multi-Staff Studio",
    price: "£29",
    cadence: "per month (optional post-launch)",
    feeBadge: "Team calendar & multi-chair tools",
    highlight: false,
    features: [
      "Everything in Early Adopter",
      "Multiple staff calendars & chair schedules",
      "Custom storefront analytics & repeat-booking insights",
      "Bulk wholesale invoice presets",
      "Priority human dispute & support line",
    ],
    ctaLabel: "Start free first",
    ctaHref: "/sign-up?intent=vendor",
  },
] as const;

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-ink">
      <SiteHeader />
      <main className="flex-1 pt-[var(--sv-hdr-h)]">
        <section className="bg-leaf-900 py-14 text-cream">
          <div className="mx-auto max-w-[1240px] px-6 lg:px-8">
            <span className="inline-block rounded-full bg-gold-200 px-3 py-1 text-[11.5px] font-bold text-gold-ink">
              Vendor &amp; Seller Pricing
            </span>
            <h1 className="mt-3 max-w-[20ch] font-serif text-3xl font-medium sm:text-5xl">
              Free to list. You keep 100% of your price.
            </h1>
            <p className="mt-3 max-w-[56ch] text-sm leading-relaxed text-cream-75 sm:text-base">
              No monthly subscription required. Servyn adds a transparent 10% protected-payment fee
              on top at checkout — so if you charge £45.00, the customer pays £49.50 and you receive
              £45.00 on confirmation.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-6 py-12 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={
                  plan.highlight
                    ? "flex flex-col justify-between rounded-[20px] border-2 border-gold-400 bg-leaf-950 p-7 text-cream shadow-lift"
                    : "flex flex-col justify-between rounded-[20px] border border-line bg-surface p-7 text-ink shadow-soft"
                }
              >
                <div>
                  <p
                    className={
                      plan.highlight
                        ? "text-xs font-bold uppercase tracking-wider text-gold-300"
                        : "text-xs font-bold uppercase tracking-wider text-leaf-700"
                    }
                  >
                    {plan.name}
                  </p>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-serif text-4xl font-semibold">{plan.price}</span>
                    <span
                      className={
                        plan.highlight ? "text-xs text-cream-60" : "text-xs text-mut"
                      }
                    >
                      {plan.cadence}
                    </span>
                  </div>
                  <p
                    className={
                      plan.highlight
                        ? "mt-3 inline-block rounded-full bg-leaf-800 px-3 py-1 text-[11.5px] font-semibold text-gold-300"
                        : "mt-3 inline-block rounded-full bg-mint px-3 py-1 text-[11.5px] font-semibold text-mint-d"
                    }
                  >
                    {plan.feeBadge}
                  </p>
                  <ul className="mt-6 space-y-2.5 text-sm">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2">
                        <CheckCircle2
                          className={
                            plan.highlight
                              ? "mt-0.5 size-4 shrink-0 text-gold-400"
                              : "mt-0.5 size-4 shrink-0 text-leaf-600"
                          }
                          aria-hidden="true"
                        />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={plan.ctaHref}
                  className={
                    plan.highlight
                      ? "mt-8 inline-flex items-center justify-center rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-5 py-3 text-sm font-semibold text-gold-ink shadow-gold"
                      : "mt-8 inline-flex items-center justify-center rounded-full bg-leaf-800 px-5 py-3 text-sm font-semibold text-cream hover:bg-leaf-700"
                  }
                >
                  {plan.ctaLabel}
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-start gap-3 rounded-lg border border-line bg-surface p-5 text-xs text-ink-2">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-leaf-700" aria-hidden="true" />
            <p className="leading-relaxed">
              <strong>Protected payment (not escrow):</strong> Card payments are processed by Stripe.
              Funds stay held until the customer confirms delivery or completion. Downloadable CSV
              &amp; PDF records are provided so you can share them with your accountant.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
