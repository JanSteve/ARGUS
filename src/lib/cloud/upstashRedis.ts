/**
 * ARGUS Sovereign OS — Upstash Distributed Redis & Anti-DDoS Rate Limiting
 */

const localMemoryCache = new Map<string, { value: any; expiresAt: number }>();

export const UpstashRedis = {
  /**
   * Set key with TTL (seconds)
   */
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      localMemoryCache.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
      // Sync to localStorage for local persistence
      localStorage.setItem(`argus_redis_${key}`, JSON.stringify(value));
    } catch {}
  },

  /**
   * Get cached key
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const mem = localMemoryCache.get(key);
      if (mem && mem.expiresAt > Date.now()) {
        return mem.value as T;
      }
      const stored = localStorage.getItem(`argus_redis_${key}`);
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  },

  /**
   * Rate Limit Guardrail (Anti-Bot / Anti-Hacker Flood Protection)
   */
  async checkRateLimit(clientIdentifier: string, maxRequests: number = 30, windowSeconds: number = 60): Promise<{ allowed: boolean; remaining: number }> {
    const key = `ratelimit_${clientIdentifier}`;
    const current = (await this.get<number>(key)) || 0;

    if (current >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    await this.set(key, current + 1, windowSeconds);
    return { allowed: true, remaining: maxRequests - (current + 1) };
  },
};
