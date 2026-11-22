import { cache } from "react";
import {
  ALL_SERVICE_PROVIDERS,
  MANCHESTER_SERVICE_AREAS,
  SERVICE_CATEGORIES,
  SERVICE_PROVIDERS,
  type ServiceCategoryMeta,
  type ServiceCategorySlug,
  type ServiceProvider,
} from "@/lib/mock-services";
import { simulateLatency } from "@/lib/data/simulate";

export type {
  ProviderAvailabilityDay,
  ProviderReview,
  ProviderServiceOffering,
  RatingBreakdown,
  ServiceCategoryMeta,
  ServiceCategorySlug,
  ServiceProvider,
} from "@/lib/mock-services";

/** Listing of every indexable service category, ordered for navigation. */
export async function getServiceCategories(): Promise<
  ReadonlyArray<ServiceCategoryMeta>
> {
  await simulateLatency(180, 360);
  return SERVICE_CATEGORIES;
}

/** Manchester service areas used by the area filter. */
export async function getServiceAreas(): Promise<ReadonlyArray<string>> {
  // Small lookup table — modelled as a near-instant indexed read.
  await simulateLatency(120, 240);
  return MANCHESTER_SERVICE_AREAS;
}

/** All service providers shown in the directory. */
export const listServiceProviders = cache(async (): Promise<
  ReadonlyArray<ServiceProvider>
> => {
  await simulateLatency(320, 620);
  return SERVICE_PROVIDERS;
});

/** Curated "community favourites" surfaced on the homepage. */
export const getFeaturedProviders = cache(async (): Promise<
  ReadonlyArray<ServiceProvider>
> => {
  await simulateLatency(300, 560);
  const featuredSlugs: ReadonlyArray<string> = [
    "amara-hair-beauty",
    "adunni-alterations",
    "zuri-glow-skin-studio",
    "kofis-kitchen",
  ];
  return featuredSlugs
    .map((slug) => ALL_SERVICE_PROVIDERS.find((provider) => provider.id === slug))
    .filter((provider): provider is ServiceProvider => Boolean(provider));
});

/** A single provider by slug (indexed lookup). */
export const getServiceProviderBySlug = cache(
  async (
    slug: string,
    skipDelay = false,
  ): Promise<ServiceProvider | undefined> => {
    if (!skipDelay) {
      await simulateLatency(140, 300);
    }
    return ALL_SERVICE_PROVIDERS.find((provider) => provider.id === slug);
  },
);

/** Slugs for static pre-generation of the provider detail pages. */
export async function listAllServiceProviderSlugs(): Promise<
  { slug: string }[]
> {
  return ALL_SERVICE_PROVIDERS.map((provider) => ({ slug: provider.id }));
}

export interface CategoryCount {
  slug: ServiceCategorySlug;
  label: string;
  providers: number;
}

/** Provider counts per category — drives the homepage "browse" cards. */
export const getCategoryCounts = cache(async (): Promise<
  ReadonlyArray<CategoryCount>
> => {
  await simulateLatency(220, 420);
  return SERVICE_CATEGORIES.map((category) => ({
    slug: category.slug,
    label: category.label,
    providers: SERVICE_PROVIDERS.filter(
      (provider) => provider.categorySlug === category.slug,
    ).length,
  }));
});
