"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  Boxes,
  Check,
  ChevronDown,
  MessageSquare,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  Truck,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCart } from "@/components/home/CartProvider";
import { MarketProductIllustration } from "@/components/market/MarketProductIllustration";
import { startOrGetConversation, useDemoFlow } from "@/lib/demo-flow-store";
import {
  APPLE_SPRING_SNAPPY,
  useRevealMotion,
  useStaggerMotion,
} from "@/components/ui/motion";
import {
  FREE_DELIVERY_THRESHOLD,
  formatGBP,
  type MarketCategory,
  type MarketProduct,
  type MarketProductId,
  type PricingMode,
} from "@/lib/mock-market";
import { cn } from "@/lib/utils";

type MarketSortOption =
  | "featured"
  | "best-selling"
  | "rating"
  | "price-asc"
  | "price-desc";

interface MarketCatalogueProps {
  products: ReadonlyArray<MarketProduct>;
  categories: ReadonlyArray<"All" | MarketCategory>;
  initialQuery: string;
  initialCategory: "All" | MarketCategory;
  initialMode: PricingMode;
}

export function MarketCatalogue({
  products,
  categories,
  initialQuery,
  initialCategory,
  initialMode,
}: MarketCatalogueProps) {
  const router = useRouter();
  const { user } = useUser();
  const currentUserName =
    user?.fullName ||
    user?.firstName ||
    user?.primaryEmailAddress?.emailAddress ||
    "Customer";
  const { customProducts, currentUserId } = useDemoFlow();
  const allProducts = React.useMemo<ReadonlyArray<MarketProduct>>(() => {
    const mapped: MarketProduct[] = customProducts.map((prd, idx) => ({
      id: prd.id as MarketProductId,
      slug: prd.slug ?? prd.id,
      ownerUserId: prd.ownerUserId,
      photos: prd.photos,
      stock: prd.stock,
      unit: prd.unit,
      name: prd.title,
      title: prd.title,
      category: (categories.find((c) => c === prd.category) ?? "Food & Pantry") as MarketCategory,
      vendor: prd.sellerName,
      vendorArea: "Manchester",
      originNote: prd.originNote,
      retailPrice: Number((prd.retailPriceMinor / 100).toFixed(2)),
      bulkPrice: Number((prd.bulkPriceMinor / 100).toFixed(2)),
      bulkMinQty: prd.minBulkQty,
      packSize: `${prd.minBulkQty} × ${prd.unit}`,
      rating: prd.avgRating ?? 0,
      reviewCount: prd.reviewCount ?? 0,
      sold: prd.soldCount ?? 0,
      featuredOrder: -1 - idx,
    }));
    const mappedIds = new Set(mapped.map((m) => m.id));
    return [...mapped, ...products.filter((p) => !mappedIds.has(p.id))];
  }, [customProducts, products, categories]);

  const {
    items,
    cartCount,
    subtotal,
    openCart,
    addToCart,
    updateQuantity,
  } = useCart();
  const reduce = useReducedMotion();
  const mastheadReveal = useRevealMotion();
  const gridMotion = useStaggerMotion(0.045);

  const [pricingMode, setPricingMode] = React.useState<PricingMode>(initialMode);
  const [query, setQuery] = React.useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = React.useState<
    "All" | MarketCategory
  >(initialCategory);
  const [sortBy, setSortBy] = React.useState<MarketSortOption>("featured");
  const [addedId, setAddedId] = React.useState<MarketProductId | null>(null);
  const timerRef = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    return () => window.clearTimeout(timerRef.current);
  }, []);

  function handleQuickAdd(product: MarketProduct) {
    addToCart(product, pricingMode);
    setAddedId(product.id);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setAddedId(null);
    }, 900);
  }

  const trimmedQuery = query.trim().toLowerCase();

  function matchesQuery(product: MarketProduct): boolean {
    if (!trimmedQuery) return true;
    const haystack =
      `${product.name} ${product.title} ${product.vendor} ${product.vendorArea} ${product.originNote} ${product.category}`.toLowerCase();
    return haystack.includes(trimmedQuery);
  }

  const allCategories = categories;
  const queryMatching = allProducts.filter(matchesQuery);

  const filteredProducts = queryMatching
    .filter((product) => {
      if (
        selectedCategory !== "All" &&
        product.category !== selectedCategory
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const aPrice = pricingMode === "bulk" ? a.bulkPrice : a.retailPrice;
      const bPrice = pricingMode === "bulk" ? b.bulkPrice : b.retailPrice;

      if (sortBy === "best-selling") return b.sold - a.sold;
      if (sortBy === "rating") return b.rating - a.rating || b.sold - a.sold;
      if (sortBy === "price-asc") return aPrice - bPrice;
      if (sortBy === "price-desc") return bPrice - aPrice;
      return a.featuredOrder - b.featuredOrder;
    });

  const remainingForFreeDelivery = Math.max(
    0,
    FREE_DELIVERY_THRESHOLD - subtotal,
  );
  const hasActiveFilter = selectedCategory !== "All" || trimmedQuery.length > 0;

  return (
    <>
      {/* Emerald Storefront Masthead */}
      <section
        aria-label="The African & Afro-Caribbean Market"
        className="relative overflow-hidden bg-leaf-900 text-cream"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 75% 70% at 88% 12%, rgba(242, 184, 75, 0.14), transparent 60%), var(--sv-diamond-pattern)",
        }}
      >
        <div className="mx-auto w-full max-w-[1240px] px-6 py-9 lg:px-8 lg:py-11">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <motion.div {...mastheadReveal}>
              <h1 className="font-serif text-[clamp(2.25rem,4vw,3.3rem)] leading-[1.06] font-semibold tracking-[-0.025em] text-cream">
                The{" "}
                <em className="font-normal text-gold-400 italic">Market.</em>
              </h1>
              <p className="mt-3 max-w-[58ch] text-[15px] leading-relaxed text-cream-85">
                Small-batch skincare, Ankara textiles, and pantry staples
                fulfilled directly by Manchester makers — retail for your home,
                wholesale for your salon or shop.
              </p>
              <div className="mt-4">
                <Link
                  href="/list?kind=product"
                  className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-4 py-2 text-xs font-bold text-gold-ink shadow-gold hover:brightness-105"
                >
                  <span>+ Sell a product</span>
                </Link>
              </div>
            </motion.div>

            <div className="flex flex-col items-start lg:items-end">
              <div
                role="group"
                aria-label="Pricing tier"
                className="relative inline-flex items-center gap-1 rounded-[14px] border border-cream/15 bg-leaf-950/60 p-1.5"
              >
                <motion.button
                  type="button"
                  aria-pressed={pricingMode === "retail"}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setPricingMode("retail")}
                  className={cn(
                    "relative z-[1] inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] px-4 py-2 text-[12.5px] font-semibold transition-colors",
                    pricingMode === "retail"
                      ? "text-ink"
                      : "text-cream-85 hover:text-cream",
                  )}
                >
                  {pricingMode === "retail" && (
                    <motion.span
                      layoutId="market-pricing-pill"
                      transition={APPLE_SPRING_SNAPPY}
                      className="absolute inset-0 -z-[1] rounded-[10px] bg-surface shadow-sm"
                    />
                  )}
                  <ShoppingBag className="size-3.5" aria-hidden="true" />
                  <span>Retail</span>
                </motion.button>
                <motion.button
                  type="button"
                  aria-pressed={pricingMode === "bulk"}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setPricingMode("bulk")}
                  className={cn(
                    "relative z-[1] inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] px-4 py-2 text-[12.5px] font-semibold transition-colors",
                    pricingMode === "bulk"
                      ? "font-bold text-gold-ink"
                      : "text-cream-85 hover:text-cream",
                  )}
                >
                  {pricingMode === "bulk" && (
                    <motion.span
                      layoutId="market-pricing-pill"
                      transition={APPLE_SPRING_SNAPPY}
                      className="absolute inset-0 -z-[1] rounded-[10px] bg-linear-to-b from-grad-gold-1 to-grad-gold-2 shadow-sm"
                    />
                  )}
                  <Boxes className="size-3.5" aria-hidden="true" />
                  <span>Bulk / Wholesale</span>
                </motion.button>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={pricingMode}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className={cn(
                    "mt-2 text-[12px] lg:text-right",
                    pricingMode === "bulk"
                      ? "font-semibold text-gold-300"
                      : "text-cream-75",
                  )}
                >
                  {pricingMode === "bulk"
                    ? "Trade pricing active — save 24%–31% with seller minimum packs."
                    : "Switch to Bulk / Wholesale to save up to 31% on trade orders."}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="h-[3px] w-full"
          style={{ background: "var(--sv-kente)" }}
        />
      </section>

      {/* Storefront Body */}
      <div className="mx-auto w-full max-w-[1240px] px-6 py-8 lg:px-8">
        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 rounded-[18px] border border-line bg-surface p-3 shadow-soft">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-full border border-line bg-surface-2 px-4 py-2">
            <Search
              className="size-4 shrink-0 text-mut"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <input
              id="market-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, makers, or areas…"
              aria-label="Search market products"
              className="min-w-0 flex-1 bg-transparent text-[13.5px] text-ink placeholder:text-mut focus:outline-none"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear product search"
                className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full bg-cream-2 text-ink-2 hover:text-ink"
              >
                <X className="size-3" strokeWidth={2} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {allCategories.map((category) => {
              const isSelected = selectedCategory === category;
              const count =
                category === "All"
                  ? queryMatching.length
                  : queryMatching.filter((p) => p.category === category).length;

              return (
                <motion.button
                  key={category}
                  type="button"
                  aria-pressed={isSelected}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "relative z-[1] inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors",
                    isSelected
                      ? "border-transparent text-cream"
                      : "border-line-2 bg-surface text-ink-2 hover:border-leaf-700",
                  )}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="market-category-pill"
                      transition={APPLE_SPRING_SNAPPY}
                      className="absolute inset-0 -z-[1] rounded-full bg-leaf-900 shadow-xs"
                    />
                  )}
                  <span>{category}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10.5px] font-bold tabular-nums",
                      isSelected
                        ? "bg-cream/15 text-cream"
                        : "bg-surface-2 text-mut",
                    )}
                  >
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <div className="relative">
            <select
              aria-label="Sort products"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as MarketSortOption)}
              className="cursor-pointer appearance-none rounded-full border border-line-2 bg-surface py-2 pr-9 pl-4 text-[13px] font-semibold text-ink transition-colors hover:border-leaf-700 focus:border-leaf-700 focus:outline-none"
            >
              <option value="featured">Sort: Featured</option>
              <option value="best-selling">Sort: Best selling</option>
              <option value="rating">Sort: Highest rated</option>
              <option value="price-asc">Sort: Price low to high</option>
              <option value="price-desc">Sort: Price high to low</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-mut"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Product Count + Live Delivery Progress */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[13px]">
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="text-mut tabular-nums">
              <span className="font-bold text-ink">
                {filteredProducts.length}
              </span>{" "}
              {filteredProducts.length === 1 ? "product" : "products"}
            </p>

            {pricingMode === "bulk" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-gold-200 bg-gold-50 px-2.5 py-0.5 text-[11.5px] font-semibold text-gold-600">
                <Boxes className="size-3" aria-hidden="true" />
                <span>Wholesale rates · MOQ applies</span>
              </span>
            )}

            {hasActiveFilter && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSelectedCategory("All");
                }}
                className="cursor-pointer text-[12px] font-semibold text-leaf-700 underline decoration-leaf-300 underline-offset-4 hover:text-leaf-900"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <p
              className={cn(
                "inline-flex items-center gap-1.5 text-[12.5px] tabular-nums",
                cartCount > 0 && remainingForFreeDelivery === 0
                  ? "font-semibold text-leaf-700"
                  : "text-mut",
              )}
            >
              {cartCount > 0 && remainingForFreeDelivery === 0 ? (
                <Check
                  className="size-3.5 text-leaf-600"
                  strokeWidth={2.25}
                  aria-hidden="true"
                />
              ) : (
                <Truck
                  className="size-3.5 text-leaf-700"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              )}
              <span>
                {cartCount === 0
                  ? "Free delivery over £50 · £3.99 standard"
                  : remainingForFreeDelivery > 0
                    ? `${formatGBP(remainingForFreeDelivery)} away from free delivery`
                    : "Free delivery unlocked"}
              </span>
            </p>

            {cartCount > 0 && (
              <button
                type="button"
                onClick={openCart}
                className="cursor-pointer rounded-full border border-leaf-200 bg-leaf-50 px-3 py-1 text-[12px] font-semibold text-leaf-800 transition-colors hover:bg-leaf-100 tabular-nums"
              >
                View basket ({cartCount})
              </button>
            )}
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="mt-5 flex flex-col items-center justify-center rounded-[22px] border border-line bg-surface px-6 py-16 text-center shadow-soft">
            <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-surface-2 text-mut">
              <Search className="size-5" aria-hidden="true" />
            </span>
            <p className="font-serif text-[20px] font-semibold text-ink">
              No matching products found
            </p>
            <p className="mt-1.5 max-w-[34ch] text-[13.5px] text-mut">
              Clear your search or switch category to view all products.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedCategory("All");
              }}
              className="mt-5 cursor-pointer rounded-full bg-leaf-900 px-5 py-2.5 text-[13px] font-semibold text-cream transition-colors hover:bg-leaf-800"
            >
              Reset search
            </button>
          </div>
        ) : (
          <motion.div
            variants={gridMotion.container}
            initial="hidden"
            animate="show"
            className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {filteredProducts.map((product) => {
              const isJustAdded = addedId === product.id;
              const displayedPrice =
                pricingMode === "bulk" ? product.bulkPrice : product.retailPrice;
              const discountPct = Math.round(
                ((product.retailPrice - product.bulkPrice) /
                  product.retailPrice) *
                  100,
              );
              const lineKey = `${product.id}:${pricingMode}`;
              const existingItem = items.find((item) => item.key === lineKey);
              const decrementDelta =
                pricingMode === "bulk" &&
                existingItem &&
                existingItem.quantity <= product.bulkMinQty
                  ? -existingItem.quantity
                  : -1;

              return (
                <motion.article
                  key={product.id}
                  layout="position"
                  variants={gridMotion.item}
                  {...gridMotion.cardProps}
                  className="group flex flex-col overflow-hidden rounded-[20px] border border-line bg-surface shadow-soft transition-[box-shadow,border-color] duration-200 hover:border-line-2 hover:shadow-lift"
                >
                  {/* Editorial Product Plinth */}
                  <Link
                    href={`/market/${encodeURIComponent(product.slug ?? product.id)}`}
                    className="relative flex aspect-[4/3.35] items-center justify-center overflow-hidden border-b border-line/70 bg-linear-to-b from-surface-2 via-gold-50/70 to-butter/55 p-5"
                  >
                    {pricingMode === "bulk" ? (
                      <span className="absolute top-3 left-3 z-[2] rounded-full bg-leaf-900 px-2.5 py-0.5 text-[11px] font-bold text-gold-300 shadow-xs">
                        Save {discountPct}%
                      </span>
                    ) : product.lowStockLabel ? (
                      <span className="absolute top-3 left-3 z-[2] rounded-full bg-gold-500 px-2.5 py-0.5 text-[11px] font-bold text-gold-ink shadow-xs">
                        {product.lowStockLabel}
                      </span>
                    ) : null}

                    <span className="absolute top-3 right-3 z-[2] rounded-full border border-line/80 bg-surface/90 px-2.5 py-0.5 text-[11px] font-semibold text-ink-2">
                      {product.packSize}
                    </span>

                    {product.photos && product.photos.length > 0 ? (
                      <Image
                        src={product.photos[0]!}
                        alt={product.name}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                      />
                    ) : (
                      <MarketProductIllustration
                        id={product.id}
                        className="transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                      />
                    )}
                  </Link>

                  {/* Card Body */}
                  <div className="flex flex-1 flex-col p-4">
                    <p className="flex items-center gap-1.5 text-[12px] text-mut">
                      <Store
                        className="size-3.5 shrink-0 text-leaf-600"
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                      <span className="truncate">
                        {product.vendor} · {product.vendorArea}
                      </span>
                    </p>

                    <Link
                      href={`/market/${encodeURIComponent(product.slug ?? product.id)}`}
                      className="mt-1 block font-serif text-[16px] leading-snug font-semibold text-ink hover:text-leaf-700"
                    >
                      {product.name}
                    </Link>

                    <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-ink-2">
                      {product.originNote}
                    </p>

                    <p className="mt-2.5 flex items-center gap-1 text-[12px] text-mut tabular-nums">
                      <Star
                        className="size-3.5 fill-gold-500 text-gold-500"
                        aria-hidden="true"
                      />
                      {product.rating > 0 ? (
                        <span className="font-bold text-ink">
                          {product.rating.toFixed(1)}
                        </span>
                      ) : (
                        <span className="font-semibold text-mut">New</span>
                      )}
                      <span>· {product.sold} sold</span>
                    </p>

                    {/* Pricing & Cart Stepper Footer */}
                    <div className="mt-auto pt-3.5">
                      <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
                        <div className="min-w-0">
                          <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                              key={pricingMode}
                              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
                              transition={{ duration: 0.16 }}
                            >
                              <div className="flex items-baseline gap-1.5 tabular-nums">
                                <span className="font-serif text-[17px] font-bold text-ink">
                                  {formatGBP(displayedPrice)}
                                </span>
                                {pricingMode === "bulk" ? (
                                  <span className="text-[11.5px] text-mut line-through">
                                    {formatGBP(product.retailPrice)}
                                  </span>
                                ) : (
                                  <span className="text-[11.5px] text-mut">
                                    each
                                  </span>
                                )}
                              </div>
                              {pricingMode === "bulk" && (
                                <p className="text-[11px] font-semibold text-leaf-700 tabular-nums">
                                  Min. {product.bulkMinQty} units
                                </p>
                              )}
                            </motion.div>
                          </AnimatePresence>
                        </div>

                        <AnimatePresence mode="wait" initial={false}>
                          {existingItem ? (
                            <motion.div
                              key="stepper"
                              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                              transition={APPLE_SPRING_SNAPPY}
                              className="inline-flex h-8 shrink-0 items-center rounded-full border border-leaf-700/25 bg-leaf-50 p-0.5"
                            >
                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.85 }}
                                onClick={() =>
                                  updateQuantity(lineKey, decrementDelta)
                                }
                                aria-label={`Decrease quantity of ${product.name}`}
                                className="flex size-7 cursor-pointer items-center justify-center rounded-full text-leaf-900 transition-colors hover:bg-leaf-100"
                              >
                                <Minus className="size-3" strokeWidth={2.25} />
                              </motion.button>
                              <motion.span
                                key={existingItem.quantity}
                                initial={reduce ? false : { scale: 0.8, opacity: 0.6 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={APPLE_SPRING_SNAPPY}
                                className="min-w-6 text-center text-[12.5px] font-bold text-ink tabular-nums"
                              >
                                {existingItem.quantity}
                              </motion.span>
                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.85 }}
                                onClick={() => updateQuantity(lineKey, 1)}
                                aria-label={`Increase quantity of ${product.name}`}
                                className="flex size-7 cursor-pointer items-center justify-center rounded-full text-leaf-900 transition-colors hover:bg-leaf-100"
                              >
                                <Plus className="size-3" strokeWidth={2.25} />
                              </motion.button>
                            </motion.div>
                          ) : (
                            <motion.button
                              key="add"
                              type="button"
                              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
                              transition={APPLE_SPRING_SNAPPY}
                              whileTap={{ scale: 0.93 }}
                              onClick={() => handleQuickAdd(product)}
                              aria-label={`Add ${product.name} to basket`}
                              className={cn(
                                "inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors",
                                isJustAdded
                                  ? "bg-gold-500 text-gold-ink"
                                  : "bg-leaf-900 text-cream hover:bg-leaf-800",
                              )}
                            >
                              {isJustAdded ? (
                                <>
                                  <Check
                                    className="size-3.5"
                                    strokeWidth={2.25}
                                    aria-hidden="true"
                                  />
                                  <span>Added</span>
                                </>
                              ) : (
                                <>
                                  <Plus
                                    className="size-3.5"
                                    strokeWidth={2}
                                    aria-hidden="true"
                                  />
                                  <span>
                                    {pricingMode === "bulk" ? "Add pack" : "Add"}
                                  </span>
                                </>
                              )}
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>

                      {currentUserId && product.ownerUserId === currentUserId ? (
                        <Link
                          href="/messages"
                          className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-leaf-200 bg-mint/40 px-3 py-1.5 text-[11.5px] font-semibold text-mint-d"
                        >
                          <span>Your listing · View customer enquiries</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const liveMatch = customProducts.find((p) => p.id === product.id);
                            const conv = startOrGetConversation({
                              kind: "product",
                              listingId: liveMatch?.id,
                              providerName: product.vendor,
                              providerSlug: liveMatch?.slug ?? "kofis-kitchen",
                              providerUserId: liveMatch?.ownerUserId,
                              listingTitle: product.title,
                              area: product.vendorArea,
                              customerName: currentUserName,
                              initialMessage: `Hi ${product.vendor}, interested in ${product.title} — could we discuss a discount or bulk price?`,
                            });
                            router.push(`/messages?thread=${encodeURIComponent(conv.id)}`);
                          }}
                          className="mt-2.5 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border border-line-2 bg-surface-2 px-3 py-1.5 text-[11.5px] font-semibold text-ink-2 transition-colors hover:border-leaf-500 hover:bg-leaf-50"
                        >
                          <MessageSquare className="size-3" aria-hidden="true" />
                          <span>Chat with seller for discount</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Full-width bottom seller-fulfillment trust strip */}
      <section
        aria-label="Market guarantees"
        className="mt-4 border-t border-leaf-200/70 bg-leaf-50"
      >
        <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-5 px-6 py-7 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-leaf-900 text-gold-400">
              <Store className="size-4.5" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-[13.5px] font-semibold text-ink">
                Fulfilled by Manchester makers
              </h2>
              <p className="mt-0.5 text-[12px] leading-snug text-mut">
                Every order ships straight from local salons, kitchens &amp;
                independent ateliers.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-leaf-900 text-gold-400">
              <Truck className="size-4.5" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-[13.5px] font-semibold text-ink">
                Free delivery over £50
              </h2>
              <p className="mt-0.5 text-[12px] leading-snug text-mut">
                Tracked UK courier dispatch or fast £3.99 standard delivery
                under £50.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-leaf-900 text-gold-400">
              <Boxes className="size-4.5" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-[13.5px] font-semibold text-ink">
                Wholesale trade rates
              </h2>
              <p className="mt-0.5 text-[12px] leading-snug text-mut">
                Toggle Bulk / Wholesale anytime to unlock salon &amp; shop case
                discounts.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-leaf-900 text-gold-400">
              <ShieldCheck
                className="size-4.5"
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </span>
            <div>
              <h2 className="text-[13.5px] font-semibold text-ink">
                Protected Stripe checkout
              </h2>
              <p className="mt-0.5 text-[12px] leading-snug text-mut">
                Clear seller policies &amp; responsive human support if an item
                arrives damaged.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
