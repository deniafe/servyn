import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { desc, eq, getDb, liveListings } from "@servyn/db";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { ServicesDirectory } from "@/components/services/ServicesDirectory";
import { ServicesWorkspaceSkeleton } from "@/components/ui/skeleton";
import {
  getServiceAreas,
  getServiceCategories,
  listServiceProviders,
  type ServiceCategoryMeta,
  type ServiceCategorySlug,
  type ServiceProvider,
} from "@/lib/data/services";
import { SERVICE_PROVIDERS } from "@/lib/mock-services";
import { loadMarketplaceStatsMap } from "@/lib/marketplace-stats";

export const metadata: Metadata = {
  title: "Services in Manchester — Servyn",
  description:
    "Browse verified African and Afro-Caribbean service providers across Manchester with transparent starting prices and protected payment.",
};

type SearchMode = "auto" | "ai" | "keyword";

function parseMode(value: string | string[] | undefined): SearchMode {
  const raw = typeof value === "string" ? value : undefined;
  if (raw === "ai") return "ai";
  if (raw === "keyword" || raw === "kw") return "keyword";
  return "auto";
}

function parseCategory(
  value: string | string[] | undefined,
  known: ReadonlyArray<{ slug: ServiceCategorySlug }>,
): "all" | ServiceCategorySlug {
  const raw = typeof value === "string" ? value : undefined;
  if (raw && known.some((category) => category.slug === raw)) {
    return raw as ServiceCategorySlug;
  }
  return "all";
}

async function loadLiveServiceProviders(
  categories: ReadonlyArray<ServiceCategoryMeta>,
): Promise<ServiceProvider[]> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(liveListings)
      .where(eq(liveListings.kind, "service"))
      .orderBy(desc(liveListings.createdAt));

    const statsMap = await loadMarketplaceStatsMap(rows);
    const templateAvailability = SERVICE_PROVIDERS[0]?.availability ?? [];

    return rows.map((row, idx) => {
      const stats = statsMap.get(row.id);
      const catMeta =
        categories.find((c) => c.label.toLowerCase() === row.category.toLowerCase()) ??
        categories[0]!;
      const pricePounds = Math.max(1, Math.round(row.priceMinor / 100));
      const initials =
        row.ownerName
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((w) => w[0]?.toUpperCase() ?? "")
          .join("") || "SV";
      const durationMins = row.durationMins ?? 60;

      return {
        id: row.slug,
        ownerUserId: row.ownerUserId,
        photos: Array.isArray(row.photos) ? row.photos : [],
        address: row.address ?? undefined,
        lat: typeof row.lat === "number" ? row.lat : undefined,
        lng: typeof row.lng === "number" ? row.lng : undefined,
        initials,
        name: row.ownerName,
        categorySlug: catMeta.slug,
        categoryLabel: row.category,
        area: row.area,
        distance: `${(0.8 + idx * 0.3).toFixed(1)} mi`,
        tagline: row.title,
        about: row.description,
        joinedLabel: "Joined 2026",
        completedBookings: stats?.soldCount ?? 0,
        serviceRadiusLabel: `${row.area} & Greater Manchester`,
        mapPinPosition: { xPercent: 52, yPercent: 48 },
        nextSlot: "Available this week",
        slots: ["10:30", "13:30", "15:00"],
        responseTime: "Replies promptly",
        bannerVar: "var(--sv-peach)",
        rating: stats?.avgRating ?? 0,
        reviews: stats?.reviewCount ?? 0,
        duration: `${durationMins} mins`,
        tags: [row.title, `${durationMins} mins`, row.area],
        startingPrice: pricePounds,
        avatarColorClass: "bg-peach text-peach-d",
        bannerBgClass: "bg-peach/60",
        availableThisWeek: true,
        verified: true,
        recommendedOrder: -1 - idx,
        keywords: [
          row.title.toLowerCase(),
          row.category.toLowerCase(),
          row.area.toLowerCase(),
        ],
        offerings: [
          {
            id: row.id,
            name: row.title,
            description: row.description,
            duration: `${durationMins} mins`,
            price: pricePounds,
          },
        ],
        ratingBreakdown: stats?.ratingBreakdown ?? [
          { stars: 5, count: 0 },
          { stars: 4, count: 0 },
          { stars: 3, count: 0 },
          { stars: 2, count: 0 },
          { stars: 1, count: 0 },
        ],
        reviewList: stats?.reviewList ?? [],
        availability: templateAvailability,
      };
    });
  } catch {
    return [];
  }
}

async function ServicesLoader({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await connection();
  const [params, providers, categories, areas] = await Promise.all([
    searchParams,
    listServiceProviders(),
    getServiceCategories(),
    getServiceAreas(),
  ]);
  const liveProviders = await loadLiveServiceProviders(categories);
  const liveIds = new Set(liveProviders.map((p) => p.id));
  const combinedProviders = [
    ...liveProviders,
    ...providers.filter((p) => !liveIds.has(p.id)),
  ];

  const initialQuery = typeof params.q === "string" ? params.q.trim() : "";
  const initialMode = parseMode(params.mode);
  const initialCategory = parseCategory(params.category, categories);

  return (
    <ServicesDirectory
      key={`${initialQuery}|${initialMode}|${initialCategory}`}
      providers={combinedProviders}
      categories={categories}
      areas={areas}
      initialQuery={initialQuery}
      initialMode={initialMode}
      initialCategory={initialCategory}
    />
  );
}

export default function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div id="top" className="flex min-h-screen flex-col bg-cream text-ink">
      <SiteHeader />

      <main className="flex-1 pt-[var(--sv-hdr-h)]">
        <Suspense fallback={<ServicesWorkspaceSkeleton />}>
          <ServicesLoader searchParams={searchParams} />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}
