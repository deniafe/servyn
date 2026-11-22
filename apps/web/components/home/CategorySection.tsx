"use client";

import Link from "next/link";
import {
  ArrowRight,
  Baby,
  Music,
  Scissors,
  Shirt,
  Sparkles,
  Store,
  Utensils,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { ScrollReveal, useStaggerMotion } from "@/components/ui/motion";
import { cn } from "@/lib/utils";
import type { CategoryCount } from "@/lib/data/services";

interface CategoryCardItem {
  label: string;
  href: string;
  icon: LucideIcon;
  tintClass: string;
  /** Category slug this card links into, or null for the market card. */
  categorySlug: string | null;
}

const CATEGORIES: ReadonlyArray<CategoryCardItem> = [
  {
    label: "Hair & Braiding",
    href: "/services?category=hair-beauty",
    icon: Scissors,
    tintClass: "bg-peach",
    categorySlug: "hair-beauty",
  },
  {
    label: "Beauty & Skincare",
    href: "/services?category=barbering-grooming",
    icon: Sparkles,
    tintClass: "bg-blush",
    categorySlug: "barbering-grooming",
  },
  {
    label: "Childcare",
    href: "/services?category=childcare-family",
    icon: Baby,
    tintClass: "bg-sky",
    categorySlug: "childcare-family",
  },
  {
    label: "Fashion & Tailoring",
    href: "/services?category=fashion-tailoring",
    icon: Shirt,
    tintClass: "bg-lav",
    categorySlug: "fashion-tailoring",
  },
  {
    label: "Home & Repairs",
    href: "/services?category=home-services",
    icon: Wrench,
    tintClass: "bg-mint",
    categorySlug: "home-services",
  },
  {
    label: "Food & Catering",
    href: "/services?category=catering-food",
    icon: Utensils,
    tintClass: "bg-sage",
    categorySlug: "catering-food",
  },
  {
    label: "Events & Music",
    href: "/services?category=djs-mcs",
    icon: Music,
    tintClass: "bg-rose",
    categorySlug: "djs-mcs",
  },
  {
    label: "African Market",
    href: "/market",
    icon: Store,
    tintClass: "bg-butter",
    categorySlug: null,
  },
];

function metaForCard(
  card: CategoryCardItem,
  counts: ReadonlyArray<CategoryCount>,
  marketProductCount: number,
): string {
  if (card.categorySlug === null) {
    return `${marketProductCount} ${marketProductCount === 1 ? "product" : "products"}`;
  }
  const match = counts.find((count) => count.slug === card.categorySlug);
  const total = match?.providers ?? 0;
  return `${total} ${total === 1 ? "provider" : "providers"}`;
}

export function CategorySection({
  categoryCounts,
  marketProductCount,
}: {
  categoryCounts: ReadonlyArray<CategoryCount>;
  marketProductCount: number;
}) {
  const { container, item } = useStaggerMotion(0.045);

  return (
    <section
      id="services"
      aria-labelledby="categories-heading"
      className="mx-auto w-full max-w-[1240px] px-6 pt-16 pb-10 lg:px-8"
    >
      <ScrollReveal className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2.5 text-[11px] font-bold tracking-[0.14em] uppercase text-gold-600">
            <span
              aria-hidden="true"
              className="inline-block h-[1.5px] w-6 bg-gold-500"
            />
            Browse by category
          </p>
          <h2
            id="categories-heading"
            className="mt-2 font-serif text-[clamp(1.75rem,3vw,2.35rem)] leading-[1.12] font-semibold tracking-[-0.02em] text-ink"
          >
            What do you need today?
          </h2>
        </div>

        <Link
          href="/services"
          className="group inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-leaf-700 transition-colors hover:text-leaf-900"
        >
          <span>All services</span>
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
        viewport={{ once: true, amount: 0.12 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <motion.div
              key={category.label}
              variants={item}
              whileHover={{
                y: -4,
                transition: { type: "spring", bounce: 0, duration: 0.28 },
              }}
              whileTap={{
                scale: 0.98,
                transition: { type: "spring", bounce: 0, duration: 0.16 },
              }}
            >
              <Link
                href={category.href}
                className="group relative block h-full overflow-hidden rounded-[18px] border border-line bg-surface p-5 shadow-soft transition-[box-shadow,border-color] duration-200 hover:border-line-2 hover:shadow-lift"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute -top-5 -right-5 size-20 rounded-full opacity-75 transition-transform duration-300 group-hover:scale-115",
                    category.tintClass,
                  )}
                />
                <div className="mb-4 flex size-11 items-center justify-center rounded-[12px] bg-leaf-900 text-gold-300 transition-transform duration-250 group-hover:-translate-y-0.5 group-hover:scale-[1.04]">
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <h3 className="text-[15px] font-semibold text-ink transition-colors group-hover:text-leaf-700">
                  {category.label}
                </h3>
                <p className="mt-1 text-[12.5px] text-mut tabular-nums">
                  {metaForCard(category, categoryCounts, marketProductCount)}
                </p>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
