import type { Config } from "drizzle-kit";
import * as path from "node:path";

// Load root .env / .env.local automatically when running from packages/db
for (const envFile of ["../../.env", "../../.env.local"]) {
  try {
    process.loadEnvFile(path.resolve(import.meta.dirname, envFile));
  } catch {
    // Missing env file is fine (e.g. CI passes DATABASE_URL directly)
  }
}

const connectionString =
  process.env["DATABASE_URL"] ?? "postgresql://servyn:servyn_local_password@localhost:5432/servyn";

export default {
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
} satisfies Config;
