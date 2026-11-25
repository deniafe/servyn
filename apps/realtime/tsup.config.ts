import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  noExternal: ["@servyn/observability", "@servyn/core"],
  external: ["@sentry/node", "require-in-the-middle", "import-in-the-middle"],
  clean: true,
  sourcemap: true,
});
