import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { ServiceProviderDetail } from "@/components/services/ServiceProviderDetail";
import {
  getServiceProviderBySlug,
  listAllServiceProviderSlugs,
} from "@/lib/data/services";

export async function generateStaticParams() {
  return listAllServiceProviderSlugs();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const provider = await getServiceProviderBySlug(slug, true);
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
  const provider = await getServiceProviderBySlug(slug, true);

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
