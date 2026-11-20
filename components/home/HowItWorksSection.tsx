import Link from "next/link";
import {
  ArrowRight,
  Baby,
  CreditCard,
  Search,
  ShieldCheck,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";

interface SideStep {
  number: number;
  title: string;
  body: string;
}

interface TrustPillar {
  icon: LucideIcon;
  title: string;
  body: string;
}

const CUSTOMER_STEPS: ReadonlyArray<SideStep> = [
  {
    number: 1,
    title: "Describe or browse",
    body: "Plain English via AI Match, or categories, search and filters.",
  },
  {
    number: 2,
    title: "Book a real slot",
    body: "Live availability, full price with the 10% fee shown, protected payment.",
  },
  {
    number: 3,
    title: "Confirm, review, rebook",
    body: "Confirm completion, review, save your person, rebook in one action.",
  },
];

const VENDOR_STEPS: ReadonlyArray<SideStep> = [
  {
    number: 1,
    title: "List in minutes",
    body: "Services or products, prices, areas, availability. No subscription.",
  },
  {
    number: 2,
    title: "One dashboard",
    body: "Bookings, chat, statuses, payouts — switch to customer any time.",
  },
  {
    number: 3,
    title: "Get paid, keep records",
    body: "Your full price on confirmation; CSV & PDF for your accountant.",
  },
];

const TRUST_PILLARS: ReadonlyArray<TrustPillar> = [
  {
    icon: ShieldCheck,
    title: "Verified identities",
    body: "Photo ID and business details checked — with a public explainer of what we don't check.",
  },
  {
    icon: Baby,
    title: "Childcare, a higher bar",
    body: "Enhanced DBS, first aid and references seen before the badge. Safeguarding lead on every concern.",
  },
  {
    icon: CreditCard,
    title: "Protected payments",
    body: "Provider's share releases on your confirmation or after a 48h hold. Not escrow.",
  },
  {
    icon: Users,
    title: "Humans, not bots",
    body: "Every report and dispute read by a person, usually within 24 hours.",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="scroll-mt-[var(--sv-hdr-h)] bg-cream text-ink"
    >
      <div className="mx-auto w-full max-w-[1240px] px-6 py-16 lg:px-8 lg:py-20">
        <p className="inline-flex items-center gap-2.5 text-[11px] font-bold tracking-[0.14em] uppercase text-gold-600">
          <span
            aria-hidden="true"
            className="inline-block h-[1.5px] w-6 bg-gold-500"
          />
          How it works
        </p>
        <h2
          id="how-it-works-heading"
          className="mt-2 font-serif text-[clamp(1.75rem,3vw,2.45rem)] leading-[1.12] font-semibold tracking-[-0.02em] text-ink"
        >
          Two sides, one account
        </h2>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col rounded-[20px] border border-line bg-surface p-7 shadow-soft">
            <h3 className="flex items-center gap-2 font-serif text-[19px] font-semibold text-ink">
              <Search
                className="size-4 shrink-0 text-gold-600"
                strokeWidth={2}
                aria-hidden="true"
              />
              <span>For customers</span>
            </h3>

            <ol className="mt-5 flex flex-col gap-4">
              {CUSTOMER_STEPS.map((step) => (
                <li key={step.number} className="flex items-start gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold-100 text-[12px] font-bold text-gold-600 tabular-nums">
                    {step.number}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-ink">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-[13px] leading-[1.5] text-mut">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-auto pt-6">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 rounded-full bg-leaf-900 px-5 py-2.5 text-[13.5px] font-semibold text-cream transition-colors hover:bg-leaf-800"
              >
                <span>Browse categories</span>
                <ArrowRight
                  className="size-4"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>

          <div className="flex flex-col rounded-[20px] border border-line bg-surface p-7 shadow-soft">
            <h3 className="flex items-center gap-2 font-serif text-[19px] font-semibold text-ink">
              <Store
                className="size-4 shrink-0 text-gold-600"
                strokeWidth={2}
                aria-hidden="true"
              />
              <span>For vendors &amp; sellers</span>
            </h3>

            <ol className="mt-5 flex flex-col gap-4">
              {VENDOR_STEPS.map((step) => (
                <li key={step.number} className="flex items-start gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold-100 text-[12px] font-bold text-gold-600 tabular-nums">
                    {step.number}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-ink">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-[13px] leading-[1.5] text-mut">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-auto pt-6">
              <Link
                href="#for-providers"
                className="inline-flex items-center gap-2 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-5 py-2.5 text-[13.5px] font-bold text-gold-ink shadow-sm transition-transform hover:brightness-[1.03] active:scale-[0.98]"
              >
                <span>Start earning</span>
                <ArrowRight
                  className="size-4"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="border-y border-leaf-200/70 bg-leaf-50">
        <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-6 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {TRUST_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div key={pillar.title} className="flex items-start gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-leaf-900 text-gold-300">
                  <Icon
                    className="size-[18px]"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[14px] font-semibold text-ink">
                    {pillar.title}
                  </h3>
                  <p className="mt-1 text-[12.5px] leading-[1.55] text-mut">
                    {pillar.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
