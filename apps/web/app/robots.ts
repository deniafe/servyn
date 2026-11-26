import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://servyn.net";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          "/dashboard",
          "/vendor",
          "/seller",
          "/account",
          "/messages",
          "/onboarding",
          "/mfa-required",
          "/suspended",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
