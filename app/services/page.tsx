import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { ServicesDirectory } from "@/components/services/ServicesDirectory";
import { ServicesWorkspaceSkeleton } from "@/components/ui/skeleton";
import {
  getServiceAreas,
  getServiceCategories,
  listServiceProviders,
  type ServiceCategorySlug,
} from "@/lib/data/services";

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

  const initialQuery = typeof params.q === "string" ? params.q.trim() : "";
  const initialMode = parseMode(params.mode);
  const initialCategory = parseCategory(params.category, categories);

  return (
    <ServicesDirectory
      key={`${initialQuery}|${initialMode}|${initialCategory}`}
      providers={providers}
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
