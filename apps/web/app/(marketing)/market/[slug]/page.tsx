import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq, getDb, liveListings, or } from "@servyn/db";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { MarketProductDetail } from "@/components/market/MarketProductDetail";
import { loadMarketplaceStatsMap } from "@/lib/marketplace-stats";
import {
  MARKET_PRODUCTS,
  type MarketCategory,
  type MarketProduct,
  type MarketProductId,
} from "@/lib/mock-market";

async function resolveProduct(slug: string): Promise<MarketProduct | null> {
  const staticMatch = MARKET_PRODUCTS.find((p) => p.id === slug);
  if (staticMatch) return staticMatch;

  try {
    const db = getDb();
    const [row] = await db
      .select()
      .from(liveListings)
      .where(or(eq(liveListings.slug, slug), eq(liveListings.id, slug)))
      .limit(1);

    if (!row || row.kind !== "product") return null;

    const statsMap = await loadMarketplaceStatsMap([row]);
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
      vendorArea: row.area,
      title: row.title,
      name: row.title,
      packSize: `${minBulkQty} × ${row.unit ?? "item"}`,
      originNote: row.description,
      category: (row.category as MarketCategory) || "Food & Pantry",
      rating: stats?.avgRating ?? 0,
      reviewCount: stats?.reviewCount ?? 0,
      reviewList: stats?.reviewList ?? [],
      sold: stats?.soldCount ?? 0,
      retailPrice,
      bulkPrice,
      bulkMinQty: minBulkQty,
      featuredOrder: -1,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await resolveProduct(decodeURIComponent(slug));
  if (!product) {
    return { title: "Product Not Found — Servyn Market" };
  }
  return {
    title: `${product.name} — Servyn Market`,
    description: product.originNote.slice(0, 160),
  };
}

export default async function MarketProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await resolveProduct(decodeURIComponent(slug));
  if (!product) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream text-ink">
      <SiteHeader />
      <main className="flex-1 pt-[var(--sv-hdr-h)]">
        <MarketProductDetail product={product} />
      </main>
      <SiteFooter />
    </div>
  );
}
