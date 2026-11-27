import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq, getDb, inArray, liveInvoices, liveListings, or } from "@servyn/db";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { ServiceProviderDetail } from "@/components/services/ServiceProviderDetail";
import {
  getServiceProviderBySlug,
  listAllServiceProviderSlugs,
  type ServiceCategorySlug,
  type ServiceProvider,
} from "@/lib/data/services";
import { SERVICE_PROVIDERS } from "@/lib/mock-services";
import { loadMarketplaceStatsMap } from "@/lib/marketplace-stats";

async function resolveProvider(slug: string): Promise<ServiceProvider | null> {
  const staticProvider = await getServiceProviderBySlug(slug, true);
  if (staticProvider) {
    try {
      const db = getDb();
      const paidInvs = await db
        .select({
          agreedDate: liveInvoices.agreedDate,
          providerName: liveInvoices.providerName,
        })
        .from(liveInvoices)
        .where(inArray(liveInvoices.status, ["paid_held", "delivered", "released"]));
      const nameLower = staticProvider.name.trim().toLowerCase();
      const bookedSlots = Array.from(
        new Set(
          paidInvs
            .filter((i) => i.providerName.trim().toLowerCase() === nameLower && i.agreedDate)
            .map((i) => i.agreedDate!.trim()),
        ),
      );
      return { ...staticProvider, bookedSlots };
    } catch {
      return staticProvider;
    }
  }

  try {
    const db = getDb();
    const [row] = await db
      .select()
      .from(liveListings)
      .where(or(eq(liveListings.slug, slug), eq(liveListings.id, slug)))
      .limit(1);

    if (!row || row.kind !== "service") return null;

    const statsMap = await loadMarketplaceStatsMap([row]);
    const stats = statsMap.get(row.id);
    const templateAvailability = SERVICE_PROVIDERS[0]?.availability ?? [];
    const initials = row.ownerName
      .split(/\s+/)
      .map((w) => w[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return {
      id: row.slug,
      ownerUserId: row.ownerUserId,
      photos: Array.isArray(row.photos) ? row.photos : [],
      address: row.address ?? undefined,
      lat: typeof row.lat === "number" ? row.lat : undefined,
      lng: typeof row.lng === "number" ? row.lng : undefined,
      initials: initials || "SV",
      name: row.ownerName,
      categorySlug: "other-local-services" as ServiceCategorySlug,
      categoryLabel: row.category,
      area: row.area,
      distance: "Manchester",
      tagline: row.title,
      about: row.description,
      joinedLabel: "Active provider",
      completedBookings: stats?.soldCount ?? 0,
      serviceRadiusLabel: `Serves ${row.area} & Greater Manchester`,
      mapPinPosition: { xPercent: 50, yPercent: 50 },
      nextSlot: "Available this week",
      slots: ["10:30", "13:30", "15:00"],
      bookedSlots: stats?.bookedSlots ?? [],
      responseTime: "Replies promptly",
      bannerVar: "--sv-mint",
      rating: stats?.avgRating ?? 0,
      reviews: stats?.reviewCount ?? 0,
      duration: `${row.durationMins ?? 60} mins`,
      tags: [row.category, row.area],
      startingPrice: Number((row.priceMinor / 100).toFixed(2)),
      avatarColorClass: "bg-leaf-800",
      bannerBgClass: "bg-mint",
      availableThisWeek: true,
      verified: true,
      recommendedOrder: 0,
      keywords: [row.title, row.category, row.area],
      offerings: [
        {
          id: row.id,
          name: row.title,
          description: row.description,
          duration: `${row.durationMins ?? 60} mins`,
          price: Number((row.priceMinor / 100).toFixed(2)),
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
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  return listAllServiceProviderSlugs();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const provider = await resolveProvider(slug);
  if (!provider) {
    return {
      title: "Service Provider Not Found — Servyn",
    };
  }
  return {
    title: `${provider.name} in ${provider.area} — Servyn`,
    description: provider.about,
  };
}

export default async function ServiceProviderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const provider = await resolveProvider(slug);

  if (!provider) {
    notFound();
  }

  return (
    <div id="top" className="flex min-h-screen flex-col bg-cream text-ink">
      <SiteHeader />

      <main className="flex-1 pt-[var(--sv-hdr-h)]">
        <ServiceProviderDetail provider={provider} />
      </main>

      <SiteFooter />
    </div>
  );
}
