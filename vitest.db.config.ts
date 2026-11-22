import { defineConfig } from "vitest/config";
import * as path from "node:path";

// Load root .env / .env.local automatically for real-Postgres integration tests
for (const envFile of [".env", ".env.local"]) {
  try {
    process.loadEnvFile(path.resolve(import.meta.dirname, envFile));
  } catch {
    // Missing env file is fine (e.g. CI passes DATABASE_URL directly)
  }
}

/**
 * Real-Postgres integration test configuration.
 * Run with: `pnpm test:db`
 * Requires a running Postgres instance with DATABASE_URL set (see docker-compose.yml or Neon .env.local).
 */
export default defineConfig({
  resolve: {
    alias: {
      "server-only": path.resolve(import.meta.dirname, "vitest.setup.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["packages/**/*.db.test.ts", "apps/**/*.db.test.ts"],
    // Sequential execution to avoid transaction conflicts between tests
    fileParallelism: false,
    // Allow enough time for migrations and real-DB round-trips
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
