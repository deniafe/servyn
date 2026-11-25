"use client";

import * as React from "react";
import Link from "next/link";
import {
  Baby,
  BadgeCheck,
  Balloon,
  Brush,
  Cake,
  Calendar,
  ChevronDown,
  Heart,
  Home,
  LayoutGrid,
  MapPin,
  Mic,
  RotateCcw,
  Scissors,
  Search,
  ShieldCheck,
  Shirt,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tent,
  Utensils,
  X,
  type LucideIcon,
} from "lucide-react";
import type {
  ServiceCategoryMeta,
  ServiceCategorySlug,
  ServiceProvider,
} from "@/lib/data/services";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  APPLE_SPRING_SNAPPY,
  APPLE_SPRING_TACTILE,
  HeartPulse,
  useRevealMotion,
  useStaggerMotion,
} from "@/components/ui/motion";
import { formatMinorGBP, useDemoFlow } from "@/lib/demo-flow-store";
import { cn } from "@/lib/utils";

type SearchMode = "auto" | "ai" | "keyword";
type SortOption = "recommended" | "rating" | "price-asc" | "price-desc" | "reviews";
type RatingFilter = 0 | 4 | 4.5 | 4.8;

const CATEGORY_ICONS: Record<ServiceCategorySlug, LucideIcon> = {
  "hair-beauty": Scissors,
  "barbering-grooming": Brush,
  "events-celebrations": Balloon,
  "event-decoration": Sparkles,
  "event-rentals": Tent,
  "djs-mcs": Mic,
  "catering-food": Utensils,
  "cakes-baking": Cake,
  "childcare-family": Baby,
  "fashion-tailoring": Shirt,
  "home-services": Home,
  "other-local-services": LayoutGrid,
};

const STARS = [0, 1, 2, 3, 4] as const;

interface ActiveFilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

interface ServicesDirectoryProps {
  providers: ReadonlyArray<ServiceProvider>;
  categories: ReadonlyArray<ServiceCategoryMeta>;
  areas: ReadonlyArray<string>;
  initialQuery: string;
  initialMode: SearchMode;
  initialCategory: "all" | ServiceCategorySlug;
}

export function ServicesDirectory({
  providers,
  categories,
  areas,
  initialQuery,
  initialMode,
  initialCategory,
}: ServicesDirectoryProps) {
  const { customServices } = useDemoFlow();
  const allProviders = React.useMemo<ReadonlyArray<ServiceProvider>>(() => {
    const mapped: ServiceProvider[] = customServices.map((svc, idx) => {
      const catMeta =
        categories.find((c) => c.label.toLowerCase() === svc.category.toLowerCase()) ??
        categories[0]!;
      const pricePounds = Math.max(1, Math.round(svc.priceMinor / 100));
      const initials = svc.providerName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("") || "SV";
      return {
        id: svc.id,
        initials,
        name: svc.providerName,
        categorySlug: catMeta.slug,
        categoryLabel: svc.category,
        area: svc.area,
        distance: `${(0.8 + idx * 0.3).toFixed(1)} mi`,
        tagline: svc.title,
        about: svc.description,
        joinedLabel: "Joined 2026",
        completedBookings: 1,
        serviceRadiusLabel: `${svc.area} & Greater Manchester`,
        mapPinPosition: { xPercent: 52, yPercent: 48 },
        nextSlot: "Sat 10:30",
        slots: ["10:30", "13:30", "15:00"],
        responseTime: "Replies in ~15 mins",
        bannerVar: "var(--sv-peach)",
        rating: 5.0,
        reviews: 1,
        duration: `${svc.durationMins} mins`,
        tags: [svc.title, `${svc.durationMins} mins`, svc.area],
        startingPrice: pricePounds,
        avatarColorClass: "bg-peach text-peach-d",
        bannerBgClass: "bg-peach/60",
        availableThisWeek: true,
        verified: true,
        recommendedOrder: -1 - idx,
        keywords: [svc.title.toLowerCase(), svc.category.toLowerCase(), svc.area.toLowerCase()],
        offerings: [
          {
            id: svc.id,
            name: svc.title,
            description: svc.description,
            duration: `${svc.durationMins} mins`,
            price: pricePounds,
          },
        ],
        ratingBreakdown: [
          { stars: 5, count: 1 },
          { stars: 4, count: 0 },
          { stars: 3, count: 0 },
          { stars: 2, count: 0 },
          { stars: 1, count: 0 },
        ],
        reviewList: [],
        availability: [
          {
            id: "sat-demo",
            weekday: "Sat",
            dayNum: 29,
            monthLabel: "Nov",
            freeCount: 3,
            slots: [
              { time: "10:30", available: true },
              { time: "13:30", available: true },
              { time: "15:00", available: true },
            ],
          },
        ],
      };
    });
    return [...mapped, ...providers];
  }, [customServices, providers, categories]);

  const [query, setQuery] = React.useState(initialQuery);
  const [searchMode, setSearchMode] = React.useState<SearchMode>(initialMode);
  const [sortBy, setSortBy] = React.useState<SortOption>("recommended");
  const [selectedCategory, setSelectedCategory] = React.useState<
    "all" | ServiceCategorySlug
  >(initialCategory);
  const [selectedArea, setSelectedArea] = React.useState("All Manchester");
  const [maxPrice, setMaxPrice] = React.useState(150);
  const [minRating, setMinRating] = React.useState<RatingFilter>(0);
  const [availableThisWeek, setAvailableThisWeek] = React.useState(false);
  const [verifiedOnly, setVerifiedOnly] = React.useState(false);
  const [savedOnly, setSavedOnly] = React.useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);
  const [savedIds, setSavedIds] = React.useState<Set<string>>(
    () =>
      new Set(
        providers.filter((p) => p.defaultSaved).map((p) => p.id),
      ),
  );

  function resetAllFilters() {
    setQuery("");
    setSelectedCategory("all");
    setSelectedArea("All Manchester");
    setMaxPrice(150);
    setMinRating(0);
    setAvailableThisWeek(false);
    setVerifiedOnly(false);
    setSavedOnly(false);
    setSortBy("recommended");
  }

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

  const reduce = useReducedMotion();
  const gridMotion = useStaggerMotion(0.045);
  const mastheadReveal = useRevealMotion();

  const parsedPriceMatch = query.match(/under\s*£?(\d+)/i);
  const queryPriceCap =
    searchMode !== "keyword" && parsedPriceMatch
      ? Number(parsedPriceMatch[1])
      : null;

  const queryTerms = query
    .toLowerCase()
    .replace(/under\s*£?\d+/gi, " ")
    .replace(
      /\b(in|near|for|a|an|the|this|saturday|sunday|friday|tomorrow|under|with)\b/gi,
      " ",
    )
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

  function getQueryScore(provider: ServiceProvider): {
    matchedAll: boolean;
    matchedCount: number;
  } {
    if (queryTerms.length === 0) {
      return { matchedAll: true, matchedCount: 0 };
    }
    const haystack = [
      provider.name,
      provider.categoryLabel,
      provider.area,
      provider.tagline,
      ...provider.tags,
      ...(searchMode === "keyword" ? [] : provider.keywords),
    ]
      .join(" ")
      .toLowerCase();

    const matchedCount = queryTerms.filter((term) =>
      haystack.includes(term),
    ).length;
    return {
      matchedAll: matchedCount === queryTerms.length,
      matchedCount,
    };
  }

  function matchesNonQueryFilters(
    provider: ServiceProvider,
    ignoreCategory = false,
  ): boolean {
    if (
      !ignoreCategory &&
      selectedCategory !== "all" &&
      provider.categorySlug !== selectedCategory
    ) {
      return false;
    }
    if (
      selectedArea !== "All Manchester" &&
      provider.area !== selectedArea
    ) {
      return false;
    }
    if (maxPrice < 150 && provider.startingPrice > maxPrice) {
      return false;
    }
    if (queryPriceCap !== null && provider.startingPrice > queryPriceCap) {
      return false;
    }
    if (minRating > 0 && provider.rating < minRating) {
      return false;
    }
    if (availableThisWeek && !provider.availableThisWeek) {
      return false;
    }
    if (verifiedOnly && !provider.verified) {
      return false;
    }
    if (savedOnly && !savedIds.has(provider.id)) {
      return false;
    }
    return true;
  }

  function filterByQuery(
    candidates: ReadonlyArray<ServiceProvider>,
  ): ServiceProvider[] {
    if (queryTerms.length === 0) {
      return [...candidates];
    }

    const scored = candidates.map((provider) => ({
      provider,
      ...getQueryScore(provider),
    }));

    const exactMatches = scored
      .filter((entry) => entry.matchedAll)
      .map((entry) => entry.provider);

    if (exactMatches.length > 0 || searchMode === "keyword") {
      return exactMatches;
    }

    // In Auto / AI Match mode, gracefully fall back to partial term matches
    // ranked by how many query terms matched when no provider matches every term.
    return scored
      .filter((entry) => entry.matchedCount > 0)
      .sort((a, b) => b.matchedCount - a.matchedCount)
      .map((entry) => entry.provider);
  }

  const baseMatching = filterByQuery(
    allProviders.filter((p) => matchesNonQueryFilters(p, true)),
  );

  const filteredProviders = filterByQuery(
    providers.filter((p) => matchesNonQueryFilters(p, false)),
  ).sort((a, b) => {
    if (sortBy === "rating") return b.rating - a.rating || b.reviews - a.reviews;
    if (sortBy === "price-asc") return a.startingPrice - b.startingPrice;
    if (sortBy === "price-desc") return b.startingPrice - a.startingPrice;
    if (sortBy === "reviews") return b.reviews - a.reviews;
    return a.recommendedOrder - b.recommendedOrder;
  });

  const activeChips: ActiveFilterChip[] = [];
  if (query.trim()) {
    activeChips.push({
      key: "query",
      label: `"${query.trim()}"`,
      onRemove: () => setQuery(""),
    });
  }
  if (selectedCategory !== "all") {
    const catLabel =
      categories.find((c) => c.slug === selectedCategory)?.label ??
      selectedCategory;
    activeChips.push({
      key: "category",
      label: catLabel,
      onRemove: () => setSelectedCategory("all"),
    });
  }
  if (selectedArea !== "All Manchester") {
    activeChips.push({
      key: "area",
      label: selectedArea,
      onRemove: () => setSelectedArea("All Manchester"),
    });
  }
  if (maxPrice < 150) {
    activeChips.push({
      key: "price",
      label: `Up to £${maxPrice}`,
      onRemove: () => setMaxPrice(150),
    });
  }
  if (minRating > 0) {
    activeChips.push({
      key: "rating",
      label: `${minRating}+ stars`,
      onRemove: () => setMinRating(0),
    });
  }
  if (availableThisWeek) {
    activeChips.push({
      key: "week",
      label: "This week",
      onRemove: () => setAvailableThisWeek(false),
    });
  }
  if (verifiedOnly) {
    activeChips.push({
      key: "verified",
      label: "Verified only",
      onRemove: () => setVerifiedOnly(false),
    });
  }
  if (savedOnly) {
    activeChips.push({
      key: "saved",
      label: "Saved",
      onRemove: () => setSavedOnly(false),
    });
  }

  const secondaryFilterCount =
    (selectedArea !== "All Manchester" ? 1 : 0) +
    (maxPrice < 150 ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (availableThisWeek ? 1 : 0) +
    (verifiedOnly ? 1 : 0) +
    (savedOnly ? 1 : 0);

  const isAllChipActive =
    !availableThisWeek && minRating === 0 && maxPrice === 150 && !savedOnly;

  const sliderPercent = ((maxPrice - 10) / (150 - 10)) * 100;

  return (
    <>
      {/* Emerald Editorial Masthead */}
      <section
        aria-label="Search Manchester services"
        className="relative overflow-hidden bg-leaf-900 text-cream"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 75% 70% at 88% 12%, rgba(242, 184, 75, 0.14), transparent 60%), var(--sv-diamond-pattern)",
        }}
      >
        <div className="mx-auto w-full max-w-[1240px] px-6 py-9 lg:px-8 lg:py-11">
          <div className="grid grid-cols-1 items-end gap-7 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
            <motion.div {...mastheadReveal}>
              <h1 className="font-serif text-[clamp(2.25rem,4vw,3.3rem)] leading-[1.06] font-semibold tracking-[-0.025em] text-cream">
                Find your{" "}
                <em className="font-normal text-gold-400 italic">person.</em>
              </h1>
              <p className="mt-3 max-w-[54ch] text-[15px] leading-relaxed text-cream-85">
                Verified African &amp; Afro-Caribbean specialists across
                Manchester — transparent starting prices and protected payment
                on every booking.
              </p>
            </motion.div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 rounded-[22px] border border-cream/15 bg-surface p-2 shadow-lift sm:flex-row sm:items-center sm:rounded-full sm:pl-4">
                <div className="flex min-w-0 flex-1 items-center gap-2.5 px-2 sm:px-0">
                  <Search
                    className="size-4 shrink-0 text-mut"
                    strokeWidth={1.85}
                    aria-hidden="true"
                  />
                  <input
                    id="services-search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search braids, jollof, barber, childcare…"
                    aria-label="Search services, providers, or areas"
                    className="min-w-0 flex-1 bg-transparent py-1.5 text-[13.5px] text-ink placeholder:text-placeholder focus:outline-none"
                  />
                  <AnimatePresence>
                    {query.length > 0 && (
                      <motion.button
                        type="button"
                        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                        transition={APPLE_SPRING_SNAPPY}
                        onClick={() => setQuery("")}
                        aria-label="Clear search query"
                        className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface-2 text-mut transition-colors hover:bg-cream-2 hover:text-ink"
                      >
                        <X className="size-3.5" strokeWidth={2} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                <div
                  role="group"
                  aria-label="Search mode"
                  className="relative inline-flex shrink-0 items-center self-start rounded-full bg-surface-2 p-0.5 sm:self-auto"
                >
                  {(
                    [
                      { id: "auto", label: "Auto" },
                      { id: "ai", label: "AI Match" },
                      { id: "keyword", label: "Keyword" },
                    ] as const
                  ).map((mode) => {
                    const active = searchMode === mode.id;
                    return (
                      <motion.button
                        key={mode.id}
                        type="button"
                        aria-pressed={active}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setSearchMode(mode.id)}
                        className={cn(
                          "relative z-[1] inline-flex cursor-pointer items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors",
                          active
                            ? "text-cream"
                            : "text-ink-2 hover:text-ink",
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId="services-search-mode-pill"
                            transition={APPLE_SPRING_SNAPPY}
                            className="absolute inset-0 -z-[1] rounded-full bg-leaf-900 shadow-xs"
                          />
                        )}
                        {mode.id === "ai" && (
                          <Sparkles className="size-3" aria-hidden="true" />
                        )}
                        <span>{mode.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Masthead quick-filter chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setAvailableThisWeek(false);
                    setMinRating(0);
                    setMaxPrice(150);
                    setSavedOnly(false);
                  }}
                  className={cn(
                    "cursor-pointer rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors",
                    isAllChipActive
                      ? "border-gold-400 bg-gold-400 text-gold-ink"
                      : "border-cream/15 bg-cream/10 text-cream-85 hover:bg-cream/16",
                  )}
                >
                  All
                </button>

                <button
                  type="button"
                  aria-pressed={availableThisWeek}
                  onClick={() => setAvailableThisWeek((prev) => !prev)}
                  className={cn(
                    "cursor-pointer rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors",
                    availableThisWeek
                      ? "border-surface bg-surface text-ink shadow-xs"
                      : "border-cream/15 bg-cream/10 text-cream-85 hover:bg-cream/16",
                  )}
                >
                  Available this week
                </button>

                <button
                  type="button"
                  aria-pressed={minRating === 4.8}
                  onClick={() =>
                    setMinRating((prev) => (prev === 4.8 ? 0 : 4.8))
                  }
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors",
                    minRating === 4.8
                      ? "border-surface bg-surface text-ink shadow-xs"
                      : "border-cream/15 bg-cream/10 text-cream-85 hover:bg-cream/16",
                  )}
                >
                  <Star
                    className={cn(
                      "size-3.5",
                      minRating === 4.8
                        ? "fill-gold-500 text-gold-500"
                        : "fill-gold-400 text-gold-400",
                    )}
                    aria-hidden="true"
                  />
                  <span>4.8+ rated</span>
                </button>

                <button
                  type="button"
                  aria-pressed={maxPrice === 30}
                  onClick={() =>
                    setMaxPrice((prev) => (prev === 30 ? 150 : 30))
                  }
                  className={cn(
                    "cursor-pointer rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors",
                    maxPrice === 30
                      ? "border-surface bg-surface text-ink shadow-xs"
                      : "border-cream/15 bg-cream/10 text-cream-85 hover:bg-cream/16",
                  )}
                >
                  Under £30
                </button>

                <button
                  type="button"
                  aria-pressed={savedOnly}
                  onClick={() => setSavedOnly((prev) => !prev)}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors tabular-nums",
                    savedOnly
                      ? "border-surface bg-surface text-ink shadow-xs"
                      : "border-cream/15 bg-cream/10 text-cream-85 hover:bg-cream/16",
                  )}
                >
                  <Heart
                    className={cn(
                      "size-3.5",
                      savedOnly ? "fill-red text-red" : "text-gold-300",
                    )}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span>Saved ({savedIds.size})</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="h-[3px] w-full"
          style={{ background: "var(--sv-kente)" }}
        />
      </section>

      {/* Main Directory Workspace */}
      <div className="mx-auto w-full max-w-[1240px] px-6 py-8 lg:px-8">
        {/* Mobile category strip & compact filter toggle */}
        <div className="mb-5 flex flex-col gap-3 lg:hidden">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "shrink-0 cursor-pointer rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors",
                selectedCategory === "all"
                  ? "border-leaf-900 bg-leaf-900 text-cream"
                  : "border-line-2 bg-surface text-ink-2",
              )}
            >
              All ({baseMatching.length})
            </button>

            {categories.map((category) => {
              const Icon = CATEGORY_ICONS[category.slug];
              const isSelected = selectedCategory === category.slug;
              return (
                <button
                  key={category.slug}
                  type="button"
                  onClick={() => setSelectedCategory(category.slug)}
                  className={cn(
                    "inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors",
                    isSelected
                      ? "border-leaf-900 bg-leaf-900 text-cream"
                      : "border-line-2 bg-surface text-ink-2",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-3.5",
                      isSelected ? "text-gold-400" : "text-leaf-600",
                    )}
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <span>{category.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              aria-expanded={mobileFiltersOpen}
              onClick={() => setMobileFiltersOpen((prev) => !prev)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line-2 bg-surface px-4 py-2 text-[13px] font-semibold text-ink shadow-soft"
            >
              <SlidersHorizontal
                className="size-3.5 text-leaf-700"
                aria-hidden="true"
              />
              <span>Filters</span>
              {secondaryFilterCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-leaf-900 text-[11px] font-bold text-cream tabular-nums">
                  {secondaryFilterCount}
                </span>
              )}
            </button>

            <div className="relative">
              <select
                aria-label="Sort providers"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="cursor-pointer appearance-none rounded-full border border-line-2 bg-surface py-2 pr-9 pl-4 text-[13px] font-semibold text-ink shadow-soft focus:border-leaf-700 focus:outline-none"
              >
                <option value="recommended">Recommended</option>
                <option value="rating">Highest rated</option>
                <option value="price-asc">Price: Low to high</option>
                <option value="price-desc">Price: High to low</option>
                <option value="reviews">Most reviewed</option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-mut"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[248px_1fr]">
          {/* Sticky left filter rail (also collapsible drawer on mobile) */}
          <aside
            aria-label="Service filters"
            className={cn(
              "rounded-[20px] border border-line bg-surface p-3 shadow-soft lg:sticky lg:top-[calc(var(--sv-hdr-h)+14px)]",
              mobileFiltersOpen ? "block" : "hidden lg:block",
            )}
          >
            <div className="hidden lg:block">
              <p className="px-2 text-[10.5px] font-bold tracking-[0.1em] uppercase text-mut">
                Category
              </p>
              <ul className="mt-1 flex flex-col gap-[1px]">
                <li>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCategory("all")}
                    className={cn(
                      "relative z-[1] flex w-full cursor-pointer items-center justify-between rounded-[9px] px-2.5 py-[5px] text-[12px] font-semibold transition-colors",
                      selectedCategory === "all"
                        ? "text-cream"
                        : "text-ink hover:bg-surface-2",
                    )}
                  >
                    {selectedCategory === "all" && (
                      <motion.span
                        layoutId="services-category-pill"
                        transition={APPLE_SPRING_SNAPPY}
                        className="absolute inset-0 -z-[1] rounded-[9px] bg-leaf-900"
                      />
                    )}
                    <span>All categories</span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10.5px] font-bold tabular-nums",
                        selectedCategory === "all"
                          ? "bg-cream/15 text-cream"
                          : "bg-surface-2 text-mut",
                      )}
                    >
                      {baseMatching.length}
                    </span>
                  </motion.button>
                </li>

                {categories.map((category) => {
                  const Icon = CATEGORY_ICONS[category.slug];
                  const isSelected = selectedCategory === category.slug;
                  const count = baseMatching.filter(
                    (p) => p.categorySlug === category.slug,
                  ).length;

                  return (
                    <li key={category.slug}>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedCategory(category.slug)}
                        className={cn(
                          "relative z-[1] flex w-full cursor-pointer items-center justify-between gap-2 rounded-[9px] px-2.5 py-[5px] text-left text-[12px] font-medium transition-colors",
                          isSelected
                            ? "font-semibold text-cream"
                            : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                        )}
                      >
                        {isSelected && (
                          <motion.span
                            layoutId="services-category-pill"
                            transition={APPLE_SPRING_SNAPPY}
                            className="absolute inset-0 -z-[1] rounded-[9px] bg-leaf-900"
                          />
                        )}
                        <span className="flex min-w-0 items-center gap-2">
                          <Icon
                            className={cn(
                              "size-3.5 shrink-0",
                              isSelected ? "text-gold-400" : "text-leaf-600",
                            )}
                            strokeWidth={1.75}
                            aria-hidden="true"
                          />
                          <span className="truncate">{category.label}</span>
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums",
                            isSelected
                              ? "bg-cream/15 text-cream"
                              : "bg-surface-2 text-mut",
                          )}
                        >
                          {count}
                        </span>
                      </motion.button>
                    </li>
                  );
                })}
              </ul>

              <div className="my-2 border-t border-line" />
            </div>

            <div>
              <label
                htmlFor="area-filter"
                className="block px-1 text-[10.5px] font-bold tracking-[0.1em] uppercase text-mut"
              >
                Area
              </label>
              <div className="relative mt-1">
                <select
                  id="area-filter"
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-[10px] border border-line-2 bg-surface-2 py-1.5 pr-9 pl-3 text-[12.5px] font-medium text-ink transition-colors hover:border-leaf-700 focus:border-leaf-700 focus:outline-none"
                >
                  {areas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-mut"
                  aria-hidden="true"
                />
              </div>
            </div>

            <div className="mt-2.5">
              <div className="flex items-center justify-between gap-2 px-1">
                <label
                  htmlFor="price-range"
                  className="text-[10.5px] font-bold tracking-[0.1em] uppercase text-mut"
                >
                  Starting price
                </label>
                <span className="rounded-full bg-leaf-50 px-2 py-0.5 text-[11px] font-semibold text-leaf-800 tabular-nums">
                  {maxPrice >= 150 ? "Any" : `Up to £${maxPrice}`}
                </span>
              </div>
              <input
                id="price-range"
                type="range"
                min={10}
                max={150}
                step={5}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                style={{
                  background: `linear-gradient(to right, var(--sv-leaf-700) 0%, var(--sv-gold-500) ${sliderPercent}%, var(--sv-line) ${sliderPercent}%)`,
                }}
                className="sv-range mt-2 w-full cursor-pointer"
              />
            </div>

            <div className="mt-2.5">
              <p className="px-1 text-[10.5px] font-bold tracking-[0.1em] uppercase text-mut">
                Minimum rating
              </p>
              <div className="mt-1 grid grid-cols-4 gap-1 rounded-full border border-line bg-surface-2 p-0.5">
                {(
                  [
                    { value: 0, label: "Any", showStar: false },
                    { value: 4, label: "4.0", showStar: true },
                    { value: 4.5, label: "4.5", showStar: true },
                    { value: 4.8, label: "4.8", showStar: true },
                  ] as const
                ).map((option) => {
                  const active = minRating === option.value;
                  return (
                    <motion.button
                      key={option.label}
                      type="button"
                      aria-pressed={active}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setMinRating(option.value)}
                      className={cn(
                        "relative z-[1] inline-flex cursor-pointer items-center justify-center gap-0.5 rounded-full py-1 text-[11px] font-semibold transition-colors tabular-nums",
                        active
                          ? "text-cream"
                          : "text-ink-2 hover:text-ink",
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="services-rating-pill"
                          transition={APPLE_SPRING_SNAPPY}
                          className="absolute inset-0 -z-[1] rounded-full bg-leaf-900 shadow-xs"
                        />
                      )}
                      <span>{option.label}</span>
                      {option.showStar && (
                        <Star
                          className={cn(
                            "size-2.5",
                            active
                              ? "fill-gold-400 text-gold-400"
                              : "fill-gold-500 text-gold-500",
                          )}
                          aria-hidden="true"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="mt-2.5 flex flex-col gap-1.5 px-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-medium text-ink">
                  Available this week
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={availableThisWeek}
                  aria-label="Toggle available this week"
                  onClick={() => setAvailableThisWeek((prev) => !prev)}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors",
                    availableThisWeek
                      ? "justify-end bg-leaf-700"
                      : "justify-start bg-line-2",
                  )}
                >
                  <motion.span
                    layout
                    transition={APPLE_SPRING_TACTILE}
                    className="inline-block size-3.5 rounded-full bg-surface shadow-xs"
                  />
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-medium text-ink">
                  Verified only
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={verifiedOnly}
                  aria-label="Toggle verified only"
                  onClick={() => setVerifiedOnly((prev) => !prev)}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors",
                    verifiedOnly
                      ? "justify-end bg-leaf-700"
                      : "justify-start bg-line-2",
                  )}
                >
                  <motion.span
                    layout
                    transition={APPLE_SPRING_TACTILE}
                    className="inline-block size-3.5 rounded-full bg-surface shadow-xs"
                  />
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink">
                  <Heart
                    className="size-3.5 fill-red text-red"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                  <span>Saved only</span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={savedOnly}
                  aria-label="Toggle saved only"
                  onClick={() => setSavedOnly((prev) => !prev)}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors",
                    savedOnly
                      ? "justify-end bg-leaf-700"
                      : "justify-start bg-line-2",
                  )}
                >
                  <motion.span
                    layout
                    transition={APPLE_SPRING_TACTILE}
                    className="inline-block size-3.5 rounded-full bg-surface shadow-xs"
                  />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={resetAllFilters}
              className="mt-2.5 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border border-line py-1.5 text-[12px] font-semibold text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <RotateCcw
                className="size-3.5"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span>Reset filters</span>
            </button>
          </aside>

          {/* Main Provider Results */}
          <div>
            {/* Results count + Active filter chips + Inline Desktop Sort */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[13px] text-mut tabular-nums">
                  {query.trim() ? (
                    <>
                      Showing{" "}
                      <span className="font-bold text-ink">
                        {filteredProviders.length}
                      </span>{" "}
                      {filteredProviders.length === 1 ? "result" : "results"}{" "}
                      for{" "}
                      <span className="font-semibold text-ink">
                        &ldquo;{query.trim()}&rdquo;
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-bold text-ink">
                        {filteredProviders.length}
                      </span>{" "}
                      {filteredProviders.length === 1
                        ? "verified provider"
                        : "verified providers"}{" "}
                      in Manchester
                    </>
                  )}
                </p>

                <AnimatePresence mode="popLayout">
                  {activeChips.map((chip) => (
                    <motion.button
                      key={chip.key}
                      layout
                      type="button"
                      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.88 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.88 }}
                      transition={APPLE_SPRING_SNAPPY}
                      whileTap={{ scale: 0.94 }}
                      onClick={chip.onRemove}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-leaf-200 bg-leaf-50 px-2.5 py-0.5 text-[11.5px] font-semibold text-leaf-800 transition-colors hover:bg-leaf-100"
                    >
                      <span>{chip.label}</span>
                      <X className="size-3" strokeWidth={2} aria-hidden="true" />
                    </motion.button>
                  ))}
                </AnimatePresence>

                {activeChips.length > 0 && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="cursor-pointer text-[12px] font-semibold text-leaf-700 underline decoration-leaf-300 underline-offset-4 hover:text-leaf-900"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="relative hidden lg:block">
                <select
                  aria-label="Sort providers"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="cursor-pointer appearance-none rounded-full border border-line-2 bg-surface py-2 pr-9 pl-4 text-[13px] font-semibold text-ink shadow-soft transition-colors hover:border-leaf-700 focus:border-leaf-700 focus:outline-none"
                >
                  <option value="recommended">Sort: Recommended</option>
                  <option value="rating">Sort: Highest rated</option>
                  <option value="price-asc">Sort: Price low to high</option>
                  <option value="price-desc">Sort: Price high to low</option>
                  <option value="reviews">Sort: Most reviewed</option>
                </select>
                <ChevronDown
                  className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-mut"
                  aria-hidden="true"
                />
              </div>
            </div>

            {searchMode !== "keyword" && query.trim().length > 0 ? (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gold-300 bg-gold-50 px-4 py-3 text-xs text-ink-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 shrink-0 text-gold-600" aria-hidden="true" />
                  <span>
                    <strong>AI Match active:</strong> Ranked from your plain-English request using
                    public listing fields (service, area, availability, price).
                    {customServices.length > 0
                      ? ` Includes ${customServices.length} newly published vendor listing (${formatMinorGBP(customServices[0]!.priceMinor)}).`
                      : ""}
                  </span>
                </div>
                <Link
                  href="/messages"
                  className="font-semibold text-leaf-800 underline underline-offset-2"
                >
                  Negotiate in chat →
                </Link>
              </div>
            ) : null}

            {filteredProviders.length === 0 ? (
              <div className="mt-5 flex flex-col items-center justify-center rounded-[22px] border border-line bg-surface px-6 py-16 text-center shadow-soft">
                <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-surface-2 text-mut">
                  <Search className="size-5" aria-hidden="true" />
                </span>
                <p className="font-serif text-[20px] font-semibold text-ink">
                  No matching providers found
                </p>
                <p className="mt-1.5 max-w-[36ch] text-[13.5px] text-mut">
                  Try widening your area filter, clearing search keywords, or
                  raising your starting price limit.
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="mt-5 cursor-pointer rounded-full bg-leaf-900 px-5 py-2.5 text-[13px] font-semibold text-cream transition-colors hover:bg-leaf-800"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <motion.div
                variants={gridMotion.container}
                initial="hidden"
                animate="show"
                className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
              >
                {filteredProviders.map((provider) => {
                  const Watermark = CATEGORY_ICONS[provider.categorySlug];
                  const isSaved = savedIds.has(provider.id);

                  return (
                    <motion.article
                      key={provider.id}
                      layout="position"
                      variants={gridMotion.item}
                      {...gridMotion.cardProps}
                      className="flex flex-col overflow-hidden rounded-[18px] border border-line bg-surface shadow-soft transition-[box-shadow,border-color] duration-200 hover:border-line-2 hover:shadow-lift"
                    >
                      {/* Signature Servyn Patterned Header (exact match to homepage cards) */}
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

                          {provider.enhancedChecks && (
                            <span className="absolute top-3 left-3 z-[2] inline-flex items-center gap-1 rounded-full border border-gold-400/30 bg-leaf-950/70 px-2.5 py-0.5 text-[10.5px] font-semibold text-cream">
                              <ShieldCheck
                                className="size-3 text-gold-400"
                                strokeWidth={2}
                                aria-hidden="true"
                              />
                              <span>Enhanced DBS</span>
                            </span>
                          )}

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
                            className="absolute inset-x-0 bottom-0 z-[2] h-[3px]"
                            style={{ background: "var(--sv-kente)" }}
                          />
                        </Link>

                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.88 }}
                          aria-pressed={isSaved}
                          aria-label={
                            isSaved
                              ? `Remove ${provider.name} from saved`
                              : `Save ${provider.name}`
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

                      {/* Card Body (exact match to homepage card density & size) */}
                      <div className="flex flex-1 flex-col p-4 pt-3.5">
                        <Link
                          href={`/services/${provider.id}`}
                          className="group"
                        >
                          <div className="flex items-start gap-1">
                            <h2 className="font-serif text-[16px] leading-snug font-semibold text-ink transition-colors group-hover:text-leaf-700">
                              {provider.name}
                            </h2>
                            {provider.verified && (
                              <BadgeCheck
                                className="mt-0.5 size-3.5 shrink-0 text-gold-600"
                                aria-label="Verified provider"
                              />
                            )}
                          </div>

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
                          <div
                            className="flex items-center gap-0.5"
                            aria-hidden="true"
                          >
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
                            <span className="text-mut">
                              ({provider.reviews})
                            </span>
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

                        {/* Footer row */}
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
            )}
          </div>
        </div>
      </div>
    </>
  );
}
