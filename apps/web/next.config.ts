import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: [
    "@servyn/core",
    "@servyn/db",
    "@servyn/ui",
    "@servyn/shared",
    "@servyn/ai",
    "@servyn/realtime",
    "@servyn/observability",
    "@servyn/domain-identity",
    "@servyn/domain-catalog",
    "@servyn/domain-discovery",
    "@servyn/domain-booking",
    "@servyn/domain-payments",
    "@servyn/domain-disputes",
    "@servyn/domain-messaging",
    "@servyn/domain-reviews",
    "@servyn/domain-commerce",
    "@servyn/domain-notifications",
    "@servyn/domain-admin",
    "@servyn/domain-gdpr",
  ],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
