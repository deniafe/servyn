// Domain schema barrel — re-exports every table so Drizzle's
// `drizzle(pool, { schema })` receives the full schema map and
// `withTransaction` / `DbExecutor` have typed query builders.

export * from "./identity.js";
export * from "./catalog.js";
export * from "./discovery.js";
export * from "./booking.js";
export * from "./payments.js";
export * from "./disputes.js";
export * from "./messaging.js";
export * from "./reviews.js";
export * from "./commerce.js";
export * from "./notifications.js";
export * from "./admin.js";
export * from "./webhooks.js";
