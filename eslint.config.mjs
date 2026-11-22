import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";

const DOMAIN_MODULES = [
  "identity",
  "catalog",
  "discovery",
  "booking",
  "payments",
  "disputes",
  "messaging",
  "reviews",
  "commerce",
  "notifications",
  "admin",
  "gdpr",
];

const SERVER_ONLY_PACKAGES = [
  "server-only",
  "@servyn/db",
  "@servyn/ai",
  "@servyn/realtime",
  "@servyn/observability",
];

const ALL_DOMAIN_PACKAGES = DOMAIN_MODULES.map((m) => `@servyn/domain-${m}`);

const domainBoundaryConfigs = DOMAIN_MODULES.map((mod) => {
  const siblingDomains = DOMAIN_MODULES.filter((m) => m !== mod).map((m) => `@servyn/domain-${m}`);
  return {
    files: [`packages/domain/${mod}/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            ...siblingDomains.map((name) => ({
              name,
              message: `Bounded module @servyn/domain-${mod} must not cross-import sibling ${name}. Orchestrate one level up.`,
            })),
            {
              name: "@servyn/web",
              message: "Domain packages must not import from @servyn/web.",
            },
          ],
          patterns: [
            {
              group: ["apps/web", "apps/web/**"],
              message: "Domain packages must not import from apps/web.",
            },
          ],
        },
      ],
    },
  };
});

const eslintConfig = defineConfig([
  globalIgnores([
    "**/.next/**",
    "**/out/**",
    "**/dist/**",
    "**/build/**",
    "**/.turbo/**",
    "**/next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
    ".agent/**",
    ".agents/**",
    ".kiro/**",
    "context/**",
  ]),
  ...nextVitals.map((cfg) => ({
    ...cfg,
    files: ["apps/web/**/*.{ts,tsx,js,jsx,mjs}"],
  })),
  ...nextTs.map((cfg) => ({
    ...cfg,
    files: ["apps/web/**/*.{ts,tsx,js,jsx,mjs}"],
  })),
  {
    files: ["apps/web/**/*.{ts,tsx,js,jsx,mjs}"],
    rules: {
      "@next/next/no-html-link-for-pages": ["error", "apps/web/app"],
    },
  },
  {
    files: ["apps/worker/src/**/*.ts", "apps/realtime/src/**/*.ts", "packages/**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: [
      "apps/worker/tsup.config.ts",
      "apps/realtime/tsup.config.ts",
      "tests/**/*.ts",
      "vitest.config.ts",
      "vitest.db.config.ts",
      "playwright.config.ts",
      "packages/db/drizzle.config.ts",
    ],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
  },
  // No domain imports in core/infra/shared/ui packages
  {
    files: [
      "packages/core/**/*.{ts,tsx}",
      "packages/db/**/*.{ts,tsx}",
      "packages/ai/**/*.{ts,tsx}",
      "packages/realtime/**/*.{ts,tsx}",
      "packages/observability/**/*.{ts,tsx}",
      "packages/ui/**/*.{ts,tsx}",
      "packages/shared/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            ...ALL_DOMAIN_PACKAGES.map((name) => ({
              name,
              message: "Infrastructure/shared packages must not import domain packages.",
            })),
            {
              name: "@servyn/web",
              message: "Packages must not import from @servyn/web.",
            },
          ],
        },
      ],
    },
  },
  // Core has no internal Servyn package dependencies
  {
    files: ["packages/core/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            ...ALL_DOMAIN_PACKAGES,
            "@servyn/db",
            "@servyn/ai",
            "@servyn/realtime",
            "@servyn/observability",
            "@servyn/ui",
            "@servyn/shared",
            "@servyn/web",
          ].map((name) => ({
            name,
            message: "@servyn/core must not depend on other @servyn/* packages.",
          })),
        },
      ],
    },
  },
  // Client-safe packages (ui, shared) must never import server-only packages
  {
    files: ["packages/ui/**/*.{ts,tsx}", "packages/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [...SERVER_ONLY_PACKAGES, ...ALL_DOMAIN_PACKAGES, "@servyn/web"].map((name) => ({
            name,
            message: "Client-safe packages must not import server-only or domain packages.",
          })),
        },
      ],
    },
  },
  // Worker and realtime apps must not import apps/web
  {
    files: ["apps/worker/**/*.ts", "apps/realtime/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@servyn/web",
              message: "Worker and realtime apps must not import from @servyn/web.",
            },
          ],
          patterns: [
            {
              group: ["apps/web", "apps/web/**"],
              message: "Worker and realtime apps must not import from apps/web.",
            },
          ],
        },
      ],
    },
  },
  ...domainBoundaryConfigs,
]);

export default eslintConfig;
