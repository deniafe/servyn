// Domain schema barrel — re-exports every table so Drizzle's
// `drizzle(pool, { schema })` receives the full schema map and
// `withTransaction` / `DbExecutor` have typed query builders.

export * from "./identity";
export * from "./catalog";
export * from "./discovery";
export * from "./booking";
export * from "./payments";
export * from "./disputes";
export * from "./messaging";
export * from "./reviews";
export * from "./commerce";
export * from "./notifications";
export * from "./admin";
export * from "./webhooks";
