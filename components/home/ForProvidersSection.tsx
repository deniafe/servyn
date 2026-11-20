"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CreditCard,
  FileText,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { ScrollReveal, useStaggerMotion } from "@/components/ui/motion";

interface ProviderBenefit {
  icon: LucideIcon;
  title: string;
  body: string;
}

const BENEFITS: ReadonlyArray<ProviderBenefit> = [
  {
    icon: CalendarCheck,
    title: "Bookings that run themselves",
    body: "Availability, reminders and statuses — less back-and-forth.",
  },
  {
    icon: MessageCircle,
    title: "Chat that stays with the booking",
    body: "Every detail in one thread, not five apps.",
  },
  {
    icon: CreditCard,
    title: "Protected payouts",
    body: "Your share, in your Stripe account, released on confirmation.",
  },
  {
    icon: FileText,
    title: "Records your accountant will love",
    body: "Downloadable CSV & PDF statements — share with your accountant.",
  },
];

export function ForProvidersSection() {
  const { container, item } = useStaggerMotion(0.06);

  return (
    <section
      id="for-providers"
      aria-labelledby="for-providers-heading"
      className="relative scroll-mt-[var(--sv-hdr-h)] overflow-hidden bg-leaf-900 text-cream"
      style={{
        backgroundImage:
          "radial-gradient(560px circle at 86% 24%, rgba(242, 184, 75, 0.08), transparent 65%), var(--sv-diamond-pattern), linear-gradient(180deg, var(--sv-leaf-900), var(--sv-leaf-950))",
      }}
    >
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-center gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-8 lg:py-20">
        <ScrollReveal>
          <p className="inline-flex items-center gap-2.5 text-[11px] font-bold tracking-[0.14em] uppercase text-gold-400">
            <span
              aria-hidden="true"
              className="inline-block h-[1.5px] w-6 bg-gold-400"
            />
            For providers
          </p>
          <h2
            id="for-providers-heading"
            className="mt-3 max-w-[12ch] font-serif text-[clamp(2rem,3.6vw,3rem)] leading-[1.06] font-semibold tracking-[-0.02em] text-cream"
          >
            Grow your business with{" "}
            <em className="font-serif italic text-gold-400">Servyn.</em>
          </h2>
          <p className="mt-5 max-w-[44ch] text-[15px] leading-[1.6] text-cream-75">
            One calendar, one chat, one payout flow — and a community that
            comes back. No listing subscription; a simple 10% fee added on top
            of your prices.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="#for-providers"
              className="group inline-flex items-center gap-2 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-6 py-3 text-[14px] font-bold text-gold-ink shadow-gold transition-[transform,filter] hover:brightness-[1.04] active:scale-[0.97]"
            >
              <span>Become a vendor</span>
              <ArrowRight
                className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                strokeWidth={2}
                aria-hidden="true"
              />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center rounded-full border border-cream/20 bg-white/[0.04] px-6 py-3 text-[14px] font-semibold text-cream transition-colors hover:border-cream/35 hover:bg-white/[0.08]"
            >
              See vendor tools
            </Link>
          </div>
        </ScrollReveal>

        <motion.ul
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="flex flex-col gap-5"
        >
          {BENEFITS.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <motion.li
                key={benefit.title}
                variants={item}
                className="flex items-start gap-4"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] border border-gold-25 bg-gold-15 text-gold-400">
                  <Icon
                    className="size-[18px]"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[14.5px] font-semibold text-cream">
                    {benefit.title}
                  </h3>
                  <p className="mt-0.5 text-[13px] leading-[1.5] text-cream-60">
                    {benefit.body}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
}
