"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Heart,
  MapPin,
  Scissors,
  Shirt,
  Sparkles,
  Star,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import {
  HeartPulse,
  ScrollReveal,
  useStaggerMotion,
} from "@/components/ui/motion";
import type {
  ServiceCategorySlug,
  ServiceProvider,
} from "@/lib/data/services";
import { cn } from "@/lib/utils";

const CATEGORY_WATERMARK: Partial<Record<ServiceCategorySlug, LucideIcon>> = {
  "hair-beauty": Scissors,
  "barbering-grooming": Scissors,
  "fashion-tailoring": Shirt,
  "catering-food": Utensils,
};

const STARS = [0, 1, 2, 3, 4] as const;

export function CommunityFavouritesSection({
  providers,
}: {
  providers: ReadonlyArray<ServiceProvider>;
}) {
  const { container, item, cardProps } = useStaggerMotion(0.055);
  const [savedIds, setSavedIds] = React.useState<Set<string>>(
    () =>
      new Set(
        providers
          .filter((provider) => provider.defaultSaved)
          .map((provider) => provider.id),
      ),
  );

  function toggleSaved(id: string) {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <section
      id="favourites"
      aria-labelledby="favourites-heading"
      className="mx-auto w-full max-w-[1240px] px-6 py-10 lg:px-8"
    >
      <ScrollReveal className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2.5 text-[11px] font-bold tracking-[0.14em] uppercase text-gold-600">
            <span
              aria-hidden="true"
              className="inline-block h-[1.5px] w-6 bg-gold-500"
            />
            Community favourites
          </p>
          <h2
            id="favourites-heading"
            className="mt-2 font-serif text-[clamp(1.75rem,3vw,2.35rem)] leading-[1.12] font-semibold tracking-[-0.02em] text-ink"
          >
            Top-rated near Hulme
          </h2>
        </div>

        <Link
          href="/services"
          className="group inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-leaf-700 transition-colors hover:text-leaf-900"
        >
          <span>View all</span>
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
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {providers.map((provider) => {
          const Watermark =
            CATEGORY_WATERMARK[provider.categorySlug] ?? Sparkles;
          const isSaved = savedIds.has(provider.id);

          return (
            <motion.article
              key={provider.id}
              variants={item}
              {...cardProps}
              className="flex flex-col overflow-hidden rounded-[18px] border border-line bg-surface shadow-soft transition-[box-shadow,border-color] duration-200 hover:border-line-2 hover:shadow-lift"
            >
              <div className="relative h-[108px] overflow-hidden">
                <Link
                  href={`/services/${provider.id}`}
                  aria-label={`View ${provider.name}`}
                  className="block size-full"
                  style={{
                    backgroundImage: `var(--sv-diamond-pattern), ${provider.bannerVar}`,
                  }}
                >
                  <Watermark
                    className="pointer-events-none absolute -right-2 -bottom-2 size-20 text-cream/12"
                    strokeWidth={1.25}
                    aria-hidden="true"
                  />

                  <div
                    className={cn(
                      "absolute bottom-2.5 left-4 z-[2] flex size-11 items-center justify-center rounded-[12px] border-2 border-cream/85 font-serif text-[16px] font-bold text-cream shadow-sm",
                      provider.avatarColorClass,
                    )}
                  >
                    {provider.initials}
                  </div>

                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-[3px]"
                    style={{ background: "var(--sv-kente)" }}
                  />
                </Link>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.88 }}
                  aria-pressed={isSaved}
                  aria-label={
                    isSaved
                      ? `Remove ${provider.name} from favourites`
                      : `Save ${provider.name} to favourites`
                  }
                  onClick={() => toggleSaved(provider.id)}
                  className={cn(
                    "absolute top-3 right-3 z-[3] flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors",
                    isSaved
                      ? "bg-surface text-red shadow-sm"
                      : "bg-leaf-950/35 text-cream/85 hover:bg-leaf-950/55 hover:text-cream",
                  )}
                >
                  <HeartPulse active={isSaved}>
                    <Heart
                      className={cn("size-4", isSaved && "fill-red")}
                      strokeWidth={1.85}
                      aria-hidden="true"
                    />
                  </HeartPulse>
                </motion.button>
              </div>

              <div className="flex flex-1 flex-col p-4 pt-3.5">
                <Link href={`/services/${provider.id}`} className="group">
                  <h3 className="font-serif text-[16px] font-semibold text-ink transition-colors group-hover:text-leaf-700">
                    {provider.name}
                  </h3>
                  <p className="mt-1 flex items-center gap-1 text-[12px] text-mut">
                    <MapPin
                      className="size-3 shrink-0 text-leaf-600"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <span className="truncate">
                      {provider.area} · {provider.distance} ·{" "}
                      {provider.categoryLabel}
                    </span>
                  </p>
                </Link>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-0.5" aria-hidden="true">
                    {STARS.map((index) => (
                      <Star
                        key={index}
                        className="size-3.5 fill-gold-500 text-gold-500"
                      />
                    ))}
                  </div>
                  <p className="text-[12.5px] tabular-nums">
                    <span className="font-bold text-ink">
                      {provider.rating.toFixed(1)}
                    </span>{" "}
                    <span className="text-mut">({provider.reviews})</span>
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {provider.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-leaf-200/70 bg-leaf-50 px-2.5 py-0.5 text-[11.5px] font-medium text-leaf-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                  <p className="text-[12.5px] text-mut tabular-nums">
                    from{" "}
                    <span className="font-serif text-[16px] font-bold text-ink">
                      £{provider.startingPrice}
                    </span>
                  </p>
                  <Link
                    href={`/services/${provider.id}`}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-3.5 py-1.5 text-[13px] font-bold text-gold-ink shadow-sm transition-transform hover:brightness-[1.03] active:scale-[0.97]"
                  >
                    <Calendar
                      className="size-3.5"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    <span>Book</span>
                  </Link>
                </div>
              </div>
            </motion.article>
          );
        })}
      </motion.div>
    </section>
  );
}
