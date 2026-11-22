/**
 * Simulated database / network latency for the prototype data layer.
 *
 * In production these repository functions map to Drizzle queries against Neon
 * Postgres. For the prototype they read from seeded tables in `lib/mock-*.ts`
 * through an async boundary so pages exercise a real request → loading
 * skeleton → streamed render cycle instead of synchronous hard-coded imports.
 */

export async function simulateLatency(
  minMs = 260,
  maxMs = 420,
): Promise<void> {
  const ms = Math.round((minMs + maxMs) / 2);
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}
