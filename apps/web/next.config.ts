import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
import * as fs from "node:fs";
import * as path from "node:path";

for (const envFile of [".env", ".env.local"]) {
  const fullPath = path.resolve(process.cwd(), "../..", envFile);
  if (fs.existsSync(fullPath)) {
    process.loadEnvFile(fullPath);
  }
}

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

export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  telemetry: false,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
