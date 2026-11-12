import "server-only";

/**
 * Rate limiting em memória (janela deslizante).
 * ---------------------------------------------------------------
 * Em produção usar Redis gerido (Upstash):
 *
 *   import { Ratelimit } from "@upstash/ratelimit";
 *   import { Redis } from "@upstash/redis";
 *   const ratelimit = new Ratelimit({
 *     redis: Redis.fromEnv(),
 *     limiter: Ratelimit.slidingWindow(10, "10 s"),
 *     analytics: true,
 *   });
 *
 * A interface abaixo mantém-se igual, pelo que a troca é transparente.
 */

type Bucket = { hits: number[]; blockedUntil?: number };

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number; blockMs?: number } = { limit: 10, windowMs: 10_000 },
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };

  if (bucket.blockedUntil && bucket.blockedUntil > now) {
    return {
      success: false,
      remaining: 0,
      resetAt: bucket.blockedUntil,
      retryAfterSeconds: Math.ceil((bucket.blockedUntil - now) / 1000),
    };
  }

  bucket.hits = bucket.hits.filter((t) => now - t < opts.windowMs);

  if (bucket.hits.length >= opts.limit) {
    bucket.blockedUntil = now + (opts.blockMs ?? opts.windowMs);
    buckets.set(key, bucket);
    return {
      success: false,
      remaining: 0,
      resetAt: bucket.blockedUntil,
      retryAfterSeconds: Math.ceil((opts.blockMs ?? opts.windowMs) / 1000),
    };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);

  // limpeza simples para evitar crescimento indefinido
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.hits.length === 0 && (!v.blockedUntil || v.blockedUntil < now)) buckets.delete(k);
    }
  }

  return {
    success: true,
    remaining: opts.limit - bucket.hits.length,
    resetAt: now + opts.windowMs,
    retryAfterSeconds: 0,
  };
}

/** Identificador do cliente a partir dos cabeçalhos do proxy. */
export function clientKey(headers: Headers, scope: string) {
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "desconhecido";
  return `${scope}:${ip}`;
}
