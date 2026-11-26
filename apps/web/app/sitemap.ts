import type { MetadataRoute } from "next";
import { SERVICE_PROVIDERS } from "@/lib/mock-services";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://servyn.net";

const STATIC_ROUTES = [
  "",
  "/services",
  "/market",
  "/ai-match",
  "/community",
  "/pricing",
  "/contact",
  "/terms",
  "/privacy",
  "/refunds",
  "/cookies",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    changeFrequency: route === "" || route === "/services" || route === "/market" ? "daily" : "weekly",
    priority: route === "" ? 1 : route === "/services" || route === "/market" ? 0.9 : 0.7,
  }));

  const providerEntries: MetadataRoute.Sitemap = SERVICE_PROVIDERS.map((provider) => ({
    url: `${SITE_URL}/services/${provider.id}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticEntries, ...providerEntries];
}
