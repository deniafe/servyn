"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, Plus, Star, Store } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCart } from "@/components/home/CartProvider";
import { MarketProductIllustration } from "@/components/market/MarketProductIllustration";
import { ScrollReveal, useStaggerMotion } from "@/components/ui/motion";
import {
  formatGBP,
  type MarketProduct,
  type MarketProductId,
} from "@/lib/mock-market";

const STARS = [0, 1, 2, 3, 4] as const;

export function AfricanMarketSection({
  products,
}: {
  products: ReadonlyArray<MarketProduct>;
}) {
  const { addToCart } = useCart();
  const reduce = useReducedMotion();
  const { container, item, cardProps } = useStaggerMotion(0.055);
  const [addedId, setAddedId] = React.useState<MarketProductId | null>(null);
  const timerRef = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    return () => window.clearTimeout(timerRef.current);
  }, []);

  function handleQuickAdd(product: MarketProduct) {
    addToCart(product, "retail");
    setAddedId(product.id);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setAddedId(null);
    }, 950);
  }

  return (
    <section
      id="market"
      aria-labelledby="market-heading"
      className="mx-auto w-full max-w-[1240px] px-6 pt-10 pb-24 lg:px-8"
    >
      <ScrollReveal className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2.5 text-[11px] font-bold tracking-[0.14em] uppercase text-gold-600">
            <span
              aria-hidden="true"
              className="inline-block h-[1.5px] w-6 bg-gold-500"
            />
            The African Market
          </p>
          <h2
            id="market-heading"
            className="mt-2 font-serif text-[clamp(1.75rem,3vw,2.35rem)] leading-[1.12] font-semibold tracking-[-0.02em] text-ink"
          >
            From the motherland, to your door
          </h2>
        </div>

        <Link
          href="/market"
          className="group inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-leaf-700 transition-colors hover:text-leaf-900"
        >
          <span>Shop the market</span>
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
        {products.map((product) => {
          const isJustAdded = addedId === product.id;

          return (
            <motion.article
              key={product.id}
              variants={item}
              {...cardProps}
              className="flex flex-col overflow-hidden rounded-[18px] border border-line bg-surface shadow-soft transition-[box-shadow,border-color] duration-200 hover:border-line-2 hover:shadow-lift"
            >
              <div className="relative flex aspect-[4/3.6] items-center justify-center overflow-hidden bg-linear-to-br from-gold-50 via-gold-100/60 to-butter/85 p-5">
                <MarketProductIllustration id={product.id} />

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.88 }}
                  onClick={() => handleQuickAdd(product)}
                  aria-label={`Add ${product.title} to basket`}
                  className="absolute right-3.5 bottom-3.5 flex size-9 cursor-pointer items-center justify-center rounded-[10px] bg-leaf-900 text-cream shadow-sm transition-colors hover:bg-leaf-800"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {isJustAdded ? (
                      <motion.span
                        key="added"
                        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.55 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.55 }}
                        transition={{ type: "spring", bounce: 0, duration: 0.24 }}
                        className="inline-flex items-center justify-center"
                      >
                        <Check
                          className="size-4 text-gold-300"
                          strokeWidth={2.25}
                          aria-hidden="true"
                        />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="plus"
                        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.55 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.55 }}
                        transition={{ type: "spring", bounce: 0, duration: 0.2 }}
                        className="inline-flex items-center justify-center"
                      >
                        <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <p className="flex items-center gap-1.5 text-[12px] text-mut">
                  <Store
                    className="size-3.5 shrink-0 text-leaf-600"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <span className="truncate">{product.vendor}</span>
                </p>

                <h3 className="mt-1 font-serif text-[15px] leading-snug font-semibold text-ink">
                  {product.title}
                </h3>

                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-0.5" aria-hidden="true">
                    {STARS.map((index) => (
                      <Star
                        key={index}
                        className="size-3 fill-gold-500 text-gold-500"
                      />
                    ))}
                  </div>
                  <p className="text-[12px] text-mut tabular-nums">
                    <span className="font-semibold text-ink-2">
                      {product.rating.toFixed(1)}
                    </span>{" "}
                    · {product.sold} sold
                  </p>
                </div>

                <div className="mt-auto flex items-baseline gap-1.5 pt-3">
                  <span className="font-serif text-[16px] font-bold text-ink tabular-nums">
                    {formatGBP(product.retailPrice)}
                  </span>
                  <span className="text-[11.5px] text-mut">retail</span>
                </div>
              </div>
            </motion.article>
          );
        })}
      </motion.div>
    </section>
  );
}
