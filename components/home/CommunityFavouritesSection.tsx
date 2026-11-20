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
import { cn } from "@/lib/utils";

interface ProviderItem {
  id: string;
  slug: string;
  initials: string;
  name: string;
  location: string;
  rating: string;
  reviews: number;
  tags: ReadonlyArray<string>;
  price: string;
  banner: string;
  badgeClass: string;
  watermark: LucideIcon;
  defaultSaved?: boolean;
}

const PROVIDERS: ReadonlyArray<ProviderItem> = [
  {
    id: "amara",
    slug: "amara-hair-beauty",
    initials: "AH",
    name: "Amara Hair & Beauty",
    location: "Hulme · 0.4 mi · Hair & Braiding",
    rating: "4.9",
    reviews: 127,
    tags: ["Knotless braids", "Silk press"],
    price: "£35",
    banner: "linear-gradient(135deg, #B88628 0%, #4E4D1F 58%, #163022 100%)",
    badgeClass: "bg-gold-600/80",
    watermark: Scissors,
  },
  {
    id: "adunni",
    slug: "adunni-alterations",
    initials: "AF",
    name: "Adunni Fashion House",
    location: "Cheetham Hill · 2.3 mi · Fashion & Tailoring",
    rating: "4.9",
    reviews: 76,
    tags: ["Ankara dresses", "Agbada"],
    price: "£25",
    banner: "linear-gradient(135deg, #743E91 0%, #3E2A5E 58%, #162925 100%)",
    badgeClass: "bg-lav-d/80",
    watermark: Shirt,
  },
  {
    id: "zuri",
    slug: "zuri-glow-skin-studio",
    initials: "ZG",
    name: "Zuri Glow Skin Studio",
    location: "Chorlton · 3.2 mi · Beauty & Skincare",
    rating: "4.9",
    reviews: 112,
    tags: ["Deep cleanse facial", "Shea rituals"],
    price: "£18",
    banner: "linear-gradient(135deg, #B44825 0%, #5F331E 58%, #1E251F 100%)",
    badgeClass: "bg-blush-d/80",
    watermark: Sparkles,
    defaultSaved: true,
  },
  {
    id: "kofi",
    slug: "kofis-kitchen",
    initials: "KK",
    name: "Kofi's Kitchen",
    location: "Moss Side · 1.1 mi · Food & Catering",
    rating: "4.8",
    reviews: 94,
    tags: ["Party jollof", "Small chops"],
    price: "£18",
    banner: "linear-gradient(135deg, #277958 0%, #154B36 58%, #0C2B1F 100%)",
    badgeClass: "bg-leaf-700/85",
    watermark: Utensils,
  },
];

const STARS = [0, 1, 2, 3, 4] as const;

export function CommunityFavouritesSection() {
  const [savedIds, setSavedIds] = React.useState<Set<string>>(
    () =>
      new Set(
        PROVIDERS.filter((provider) => provider.defaultSaved).map(
          (provider) => provider.id,
        ),
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
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
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
          className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-leaf-700 transition-colors hover:text-leaf-900"
        >
          <span>View all</span>
          <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PROVIDERS.map((provider) => {
          const Watermark = provider.watermark;
          const isSaved = savedIds.has(provider.id);

          return (
            <article
              key={provider.id}
              className="flex flex-col overflow-hidden rounded-[18px] border border-line bg-surface shadow-soft transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-line-2 hover:shadow-lift"
            >
              <div className="relative h-[108px] overflow-hidden">
                <Link
                  href={`/services/${provider.slug}`}
                  aria-label={`View ${provider.name}`}
                  className="block size-full"
                  style={{
                    backgroundImage: `var(--sv-diamond-pattern), ${provider.banner}`,
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
                      provider.badgeClass,
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

                <button
                  type="button"
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
                  <Heart
                    className={cn("size-4", isSaved && "fill-red")}
                    strokeWidth={1.85}
                    aria-hidden="true"
                  />
                </button>
              </div>

              <div className="flex flex-1 flex-col p-4 pt-3.5">
                <Link href={`/services/${provider.slug}`} className="group">
                  <h3 className="font-serif text-[16px] font-semibold text-ink transition-colors group-hover:text-leaf-700">
                    {provider.name}
                  </h3>
                  <p className="mt-1 flex items-center gap-1 text-[12px] text-mut">
                    <MapPin
                      className="size-3 shrink-0 text-leaf-600"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <span className="truncate">{provider.location}</span>
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
                    <span className="font-bold text-ink">{provider.rating}</span>{" "}
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
                      {provider.price}
                    </span>
                  </p>
                  <Link
                    href={`/services/${provider.slug}`}
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
            </article>
          );
        })}
      </div>
    </section>
  );
}
