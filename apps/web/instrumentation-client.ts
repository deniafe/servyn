import * as Sentry from "@sentry/nextjs";
import { redactSentryEvent } from "@servyn/observability/redact";

const dsn = process.env["NEXT_PUBLIC_SENTRY_DSN"]?.trim();

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env["NODE_ENV"] ?? "development",
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    beforeSend(event) {
      return redactSentryEvent(event as unknown as Record<string, unknown>) as unknown as typeof event;
    },
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
