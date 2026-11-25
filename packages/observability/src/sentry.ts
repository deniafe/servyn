import * as Sentry from "@sentry/node";
import { redactSentryEvent } from "./redact";

let initialized = false;

export function initNodeSentry(service: "worker" | "realtime"): void {
  if (initialized) return;
  const dsn = process.env["SENTRY_DSN"]?.trim();
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env["NODE_ENV"] ?? "development",
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    beforeSend(event) {
      return redactSentryEvent(event as unknown as Record<string, unknown>) as unknown as typeof event;
    },
    initialScope: {
      tags: { service },
    },
  });

  initialized = true;
}
