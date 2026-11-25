import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createLogger } from "./logger";

export type RateLimitBucket = "auth" | "api" | "search" | "aiMatch" | "report";

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
  upstashWindow: `${number} s` | `${number} m` | `${number} h`;
}

export const RATE_LIMIT_BUCKETS: Record<RateLimitBucket, RateLimitConfig> = {
  auth: { limit: 20, windowMs: 60_000, upstashWindow: "1 m" },
  api: { limit: 60, windowMs: 60_000, upstashWindow: "1 m" },
  search: { limit: 60, windowMs: 60_000, upstashWindow: "1 m" },
  aiMatch: { limit: 15, windowMs: 60_000, upstashWindow: "1 m" },
  report: { limit: 10, windowMs: 600_000, upstashWindow: "10 m" },
};

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAtMs: number;
  retryAfterSeconds: number;
  backend: "upstash" | "memory";
}

const logger = createLogger({ service: "web", module: "rate-limit" });

interface MemoryEntry {
  timestamps: number[];
}

const memoryStore = new Map<string, MemoryEntry>();
const upstashLimiters = new Map<RateLimitBucket, Ratelimit>();
let cachedRedis: Redis | null | undefined;

export function resetInMemoryRateLimits(): void {
  memoryStore.clear();
}

function getUpstashRedis(): Redis | null {
  if (cachedRedis !== undefined) return cachedRedis;
  const url = process.env["UPSTASH_REDIS_REST_URL"]?.trim();
  const token = process.env["UPSTASH_REDIS_REST_TOKEN"]?.trim();
  if (!url || !token) {
    cachedRedis = null;
    return null;
  }
  cachedRedis = new Redis({ url, token });
  return cachedRedis;
}

function getUpstashLimiter(bucket: RateLimitBucket): Ratelimit | null {
  const existing = upstashLimiters.get(bucket);
  if (existing) return existing;

  const redis = getUpstashRedis();
  if (!redis) return null;

  const cfg = RATE_LIMIT_BUCKETS[bucket];
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(cfg.limit, cfg.upstashWindow),
    prefix: `servyn:rl:${bucket}`,
  });
  upstashLimiters.set(bucket, limiter);
  return limiter;
}

function checkMemoryRateLimit(
  bucket: RateLimitBucket,
  identifier: string,
  nowMs: number,
): RateLimitResult {
  const cfg = RATE_LIMIT_BUCKETS[bucket];
  const key = `${bucket}:${identifier}`;
  const cutoff = nowMs - cfg.windowMs;
  const entry = memoryStore.get(key) ?? { timestamps: [] };
  const recent = entry.timestamps.filter((ts) => ts > cutoff);

  if (recent.length >= cfg.limit) {
    const oldest = recent[0] ?? nowMs;
    const resetAtMs = oldest + cfg.windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetAtMs - nowMs) / 1000));
    memoryStore.set(key, { timestamps: recent });
    return {
      allowed: false,
      limit: cfg.limit,
      remaining: 0,
      resetAtMs,
      retryAfterSeconds,
      backend: "memory",
    };
  }

  recent.push(nowMs);
  memoryStore.set(key, { timestamps: recent });
  const resetAtMs = (recent[0] ?? nowMs) + cfg.windowMs;

  return {
    allowed: true,
    limit: cfg.limit,
    remaining: Math.max(0, cfg.limit - recent.length),
    resetAtMs,
    retryAfterSeconds: 0,
    backend: "memory",
  };
}

export async function checkRateLimit(
  bucket: RateLimitBucket,
  identifier: string,
  nowMs: number = Date.now(),
): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter(bucket);
  const cfg = RATE_LIMIT_BUCKETS[bucket];

  if (!limiter) {
    return checkMemoryRateLimit(bucket, identifier, nowMs);
  }

  try {
    const res = await limiter.limit(identifier);
    const resetAtMs = res.reset;
    const retryAfterSeconds = res.success
      ? 0
      : Math.max(1, Math.ceil((resetAtMs - Date.now()) / 1000));
    return {
      allowed: res.success,
      limit: res.limit,
      remaining: res.remaining,
      resetAtMs,
      retryAfterSeconds,
      backend: "upstash",
    };
  } catch (err) {
    logger.warn("Upstash rate limit failed; falling back to in-memory window", {
      bucket,
      limit: cfg.limit,
      error: err instanceof Error ? err.message : String(err),
    });
    return checkMemoryRateLimit(bucket, identifier, nowMs);
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}
