"use client";

import Link from "next/link";
import {
  ArrowRight,
  CircleCheck,
  CreditCard,
  Info,
  MessageCircle,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { ScrollReveal, useStaggerMotion } from "@/components/ui/motion";

interface PaymentStep {
  step: number;
  icon: LucideIcon;
  title: string;
  body: string;
}

const STEPS: ReadonlyArray<PaymentStep> = [
  {
    step: 1,
    icon: CreditCard,
    title: "Book & pay",
    body: "Payment linked to the booking; the provider's share sits in their own Stripe account.",
  },
  {
    step: 2,
    icon: MessageCircle,
    title: "The service happens",
    body: "Chat, details and changes stay attached — evidence if anything goes wrong.",
  },
  {
    step: 3,
    icon: CircleCheck,
    title: "You confirm — or 48h",
    body: "Confirm to release; no response auto-releases 48h after they mark complete.",
  },
  {
    step: 4,
    icon: ShieldCheck,
    title: "Problem? Payout pauses",
    body: "Report and a human reviews; refunds follow the published tiers.",
  },
];

export function ProtectedPaymentSection() {
  const { container, item } = useStaggerMotion(0.06);

  return (
    <section
      id="protected-payments"
      aria-labelledby="protected-payment-heading"
      className="relative scroll-mt-[var(--sv-hdr-h)] overflow-hidden bg-leaf-900 text-cream"
      style={{
        backgroundImage:
          "radial-gradient(560px circle at 88% 18%, rgba(242, 184, 75, 0.08), transparent 65%), var(--sv-diamond-pattern), linear-gradient(180deg, var(--sv-leaf-900), var(--sv-leaf-950))",
      }}
    >
      <div className="mx-auto w-full max-w-[1240px] px-6 py-16 lg:px-8 lg:py-20">
        <ScrollReveal className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2.5 text-[11px] font-bold tracking-[0.14em] uppercase text-gold-400">
              <span
                aria-hidden="true"
                className="inline-block h-[1.5px] w-6 bg-gold-400"
              />
              Protected payment
            </p>
            <h2
              id="protected-payment-heading"
              className="mt-2.5 max-w-[16ch] font-serif text-[clamp(1.85rem,3.4vw,2.75rem)] leading-[1.08] font-semibold tracking-[-0.02em] text-cream"
            >
              Your money waits for the work to be{" "}
              <em className="font-serif italic">done.</em>
            </h2>
          </div>

          <Link
            href="#how-it-works"
            className="group inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-gold-400 transition-colors hover:text-gold-300"
          >
            <span>How disputes work</span>
            <ArrowRight
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </Link>
        </ScrollReveal>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <motion.article
                key={step.step}
                variants={item}
                whileHover={{
                  y: -3,
                  transition: { type: "spring", bounce: 0, duration: 0.28 },
                }}
                className="flex flex-col rounded-[18px] border border-cream/10 bg-white/[0.03] p-6 transition-colors hover:border-gold-25 hover:bg-white/[0.055]"
              >
                <div className="mb-5 flex items-start justify-between gap-3">
                  <span className="flex size-10 items-center justify-center rounded-[12px] border border-gold-25 bg-gold-15 text-gold-400">
                    <Icon
                      className="size-[18px]"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </span>
                  <span
                    aria-hidden="true"
                    className="font-serif text-[32px] leading-none font-normal text-cream/20 select-none tabular-nums"
                  >
                    {step.step}
                  </span>
                </div>

                <h3 className="text-[15.5px] font-semibold text-gold-300">
                  {step.title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-[1.55] text-cream-75">
                  {step.body}
                </p>
              </motion.article>
            );
          })}
        </motion.div>

        <p className="mt-7 flex items-start gap-2 text-[12px] leading-[1.55] text-cream-60">
          <Info
            className="mt-0.5 size-3.5 shrink-0 text-gold-400/80"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <span>
            Protected payment, not escrow. Timing and handling of funds follow
            Stripe&apos;s permitted configuration, connected-account terms and
            applicable law. Card details go into Stripe&apos;s secure fields —
            Servyn never sees them.
          </span>
        </p>
      </div>
    </section>
  );
}
