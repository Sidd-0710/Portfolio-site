/**
 * Sliding-window rate limiter kept in memory. On a serverless host each warm
 * instance has its own memory, so this is a per-instance guard: enough to
 * stop one visitor or a simple script from draining the free model quota,
 * not a distributed limit. A shared store (e.g. Upstash Redis) would make it
 * exact if traffic ever needs that.
 */
export interface RateLimiter {
  /** Records a hit for `key` and says whether it's allowed, and if not, when to retry. */
  check(key: string, now?: number): { allowed: true } | { allowed: false; retryAfterSeconds: number }
}

export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }): RateLimiter {
  const hits = new Map<string, number[]>()

  return {
    check(key, now = Date.now()) {
      const recent = (hits.get(key) ?? []).filter(t => now - t < windowMs)
      if (recent.length >= limit) {
        hits.set(key, recent)
        const oldest = recent[0] ?? now
        return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)) }
      }
      recent.push(now)
      hits.set(key, recent)
      /* Drop idle keys now and then so the map can't grow without bound. */
      if (hits.size > 5_000) {
        for (const [k, times] of hits) if (times.every(t => now - t >= windowMs)) hits.delete(k)
      }
      return { allowed: true }
    },
  }
}
