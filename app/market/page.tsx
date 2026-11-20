import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { MarketCatalogue } from "@/components/market/MarketCatalogue";
import { MarketWorkspaceSkeleton } from "@/components/ui/skeleton";
import {
  getMarketCategories,
  listMarketProducts,
  type MarketCategory,
  type PricingMode,
} from "@/lib/data/market";

export const metadata: Metadata = {
  title: "The African Market — Servyn",
  description:
    "Shop retail and wholesale Afro-Caribbean textiles, raw shea butter, pantry spices, and crafts directly from Manchester sellers.",
};

function parsePricingMode(value: string | string[] | undefined): PricingMode {
  return value === "bulk" ? "bulk" : "retail";
}

function parseCategory(
  value: string | string[] | undefined,
  known: ReadonlyArray<"All" | MarketCategory>,
): "All" | MarketCategory {
  if (typeof value === "string") {
    const match = known.find(
      (cat) => cat.toLowerCase() === value.toLowerCase(),
    );
    if (match) return match;
  }
  return "All";
}

async function MarketLoader({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await connection();
  const [params, products, categories] = await Promise.all([
    searchParams,
    listMarketProducts(),
    getMarketCategories(),
  ]);

  const initialQuery = typeof params.q === "string" ? params.q.trim() : "";
  const initialMode = parsePricingMode(params.mode);
  const initialCategory = parseCategory(params.category, categories);

  return (
    <MarketCatalogue
      key={`${initialQuery}|${initialCategory}|${initialMode}`}
      products={products}
      categories={categories}
      initialQuery={initialQuery}
      initialCategory={initialCategory}
      initialMode={initialMode}
    />
  );
}

export default function MarketPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div id="top" className="flex min-h-screen flex-col bg-cream text-ink">
      <SiteHeader />

      <main className="flex-1 pt-[var(--sv-hdr-h)]">
        <Suspense fallback={<MarketWorkspaceSkeleton />}>
          <MarketLoader searchParams={searchParams} />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}
