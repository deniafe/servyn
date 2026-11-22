import "server-only";
import { inngest } from "./client";

export const healthPing = inngest.createFunction(
  { id: "health.ping" },
  { event: "health/ping" },
  async ({ event }) => {
    return {
      ok: true,
      receivedAt: new Date().toISOString(),
      eventId: event.id ?? null,
    };
  },
);

export const inngestFunctions = [healthPing];
