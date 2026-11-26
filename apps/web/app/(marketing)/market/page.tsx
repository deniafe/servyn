import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { desc, eq, getDb, liveListings } from "@servyn/db";
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
import { loadMarketplaceStatsMap } from "@/lib/marketplace-stats";
import type { MarketProduct, MarketProductId } from "@/lib/mock-market";

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

async function loadLiveMarketProducts(
  categories: ReadonlyArray<"All" | MarketCategory>,
): Promise<MarketProduct[]> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(liveListings)
      .where(eq(liveListings.kind, "product"))
      .orderBy(desc(liveListings.createdAt));

    const statsMap = await loadMarketplaceStatsMap(rows);

    return rows.map((row, idx) => {
      const stats = statsMap.get(row.id);
      const retailPrice = Number((row.priceMinor / 100).toFixed(2));
      const bulkPrice = Number(((row.bulkPriceMinor ?? row.priceMinor) / 100).toFixed(2));
      const minBulkQty = row.minBulkQty ?? 5;

      return {
        id: row.id as MarketProductId,
        slug: row.slug,
        ownerUserId: row.ownerUserId,
        photos: Array.isArray(row.photos) ? row.photos : [],
        stock: row.stock ?? 20,
        unit: row.unit ?? "item",
        vendor: row.ownerName,
        vendorArea: row.area || "Manchester",
        title: row.title,
        name: row.title,
        packSize: `${minBulkQty} × ${row.unit ?? "item"}`,
        originNote: row.description,
        category: (categories.find((c) => c === row.category) ?? "Food & Pantry") as MarketCategory,
        rating: stats?.avgRating ?? 0,
        reviewCount: stats?.reviewCount ?? 0,
        sold: stats?.soldCount ?? 0,
        retailPrice,
        bulkPrice,
        bulkMinQty: minBulkQty,
        featuredOrder: -1 - idx,
      };
    });
  } catch {
    return [];
  }
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
  const liveProducts = await loadLiveMarketProducts(categories);
  const liveIds = new Set(liveProducts.map((p) => p.id));
  const combinedProducts = [
    ...liveProducts,
    ...products.filter((p) => !liveIds.has(p.id)),
  ];

  const initialQuery = typeof params.q === "string" ? params.q.trim() : "";
  const initialMode = parsePricingMode(params.mode);
  const initialCategory = parseCategory(params.category, categories);

  return (
    <MarketCatalogue
      key={`${initialQuery}|${initialCategory}|${initialMode}`}
      products={combinedProducts}
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
