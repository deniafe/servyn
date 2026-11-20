import { cache } from "react";
import {
  MARKET_CATEGORIES,
  MARKET_PRODUCTS,
  type MarketCategory,
  type MarketProduct,
  type MarketProductId,
} from "@/lib/mock-market";
import { simulateLatency } from "@/lib/data/simulate";

export type {
  MarketCategory,
  MarketProduct,
  MarketProductId,
  PricingMode,
} from "@/lib/mock-market";

export {
  formatGBP,
  FREE_DELIVERY_THRESHOLD,
  MARKET_CATEGORIES,
  STANDARD_DELIVERY_FEE,
} from "@/lib/mock-market";

/** Market categories for storefront filtering. */
export const getMarketCategories = cache(async (): Promise<
  ReadonlyArray<"All" | MarketCategory>
> => {
  await simulateLatency(120, 200);
  return MARKET_CATEGORIES;
});

/** Every market product, in seed order. */
export const listMarketProducts = cache(async (): Promise<
  ReadonlyArray<MarketProduct>
> => {
  await simulateLatency(260, 420);
  return MARKET_PRODUCTS;
});

/** Featured market products surfaced on the homepage African Market strip. */
export const getFeaturedMarketProducts = cache(async (): Promise<
  ReadonlyArray<MarketProduct>
> => {
  await simulateLatency(240, 380);
  const featuredIds: ReadonlyArray<MarketProductId> = [
    "ankara",
    "shea",
    "jollof",
    "soap",
  ];
  return featuredIds
    .map((id) => MARKET_PRODUCTS.find((product) => product.id === id))
    .filter((product): product is MarketProduct => Boolean(product));
});

/** Total product count — used by the homepage "African Market" card. */
export const getMarketProductCount = cache(async (): Promise<number> => {
  await simulateLatency(120, 200);
  return MARKET_PRODUCTS.length;
});
