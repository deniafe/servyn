import { defineConfig } from "vitest/config";
import * as path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "server-only": path.resolve(import.meta.dirname, "vitest.setup.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["packages/**/*.test.ts", "apps/**/*.test.ts"],
    // Real-Postgres integration tests run separately via `pnpm test:db`
    exclude: ["**/*.db.test.ts", "**/node_modules/**"],
  },
});
