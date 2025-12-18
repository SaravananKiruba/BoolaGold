/**
 * 🛡️ API Rate Limiter for Multi-Tenant Protection
 * 
 * Prevents abuse and ensures fair resource allocation across 300+ shops
 * 
 * LIMITS:
 * - Per Shop: 100 req/min (normal operations)
 * - Per IP: 200 req/min (prevents DDoS)
 * - Bulk Operations: 10 req/min (imports, exports)
 * - Super Admin: Unlimited
 * 
 * PRODUCTION: Use Redis-based rate limiting (upstash/ratelimit)
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class InMemoryRateLimiter {
  private limits: Map<string, RateLimitEntry>;
  private readonly WINDOW_MS = 60000; // 1 minute

  constructor() {
    this.limits = new Map();
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if request is allowed
   * @returns { allowed: boolean, remaining: number, resetTime: number }
   */
  check(key: string, limit: number): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.limits.get(key);

    // No entry or expired window - allow request
    if (!entry || now > entry.resetTime) {
      const resetTime = now + this.WINDOW_MS;
      this.limits.set(key, { count: 1, resetTime });
      return { allowed: true, remaining: limit - 1, resetTime };
    }

    // Within window - check limit
    if (entry.count >= limit) {
      return { allowed: false, remaining: 0, resetTime: entry.resetTime };
    }

    // Increment count
    entry.count++;
    this.limits.set(key, entry);
    return { allowed: true, remaining: limit - entry.count, resetTime: entry.resetTime };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * Reset limit for a key
   */
  reset(key: string): void {
    this.limits.delete(key);
  }
}

// Singleton instance
const rateLimiter = new InMemoryRateLimiter();

/**
 * Rate limit configurations
 */
export const RATE_LIMITS = {
  DEFAULT: 100, // requests per minute per shop
  BULK_OPERATION: 10, // bulk imports/exports
  AUTH: 5, // login attempts
  REPORTS: 20, // report generation
} as const;

/**
 * Check rate limit for shop
 */
export function checkShopRateLimit(shopId: string, limit: number = RATE_LIMITS.DEFAULT) {
  return rateLimiter.check(`shop:${shopId}`, limit);
}

/**
 * Check rate limit for IP address
 */
export function checkIPRateLimit(ip: string, limit: number = 200) {
  return rateLimiter.check(`ip:${ip}`, limit);
}

/**
 * Check rate limit for specific operation
 */
export function checkOperationRateLimit(
  shopId: string,
  operation: string,
  limit: number = RATE_LIMITS.DEFAULT
) {
  return rateLimiter.check(`shop:${shopId}:${operation}`, limit);
}

/**
 * Middleware helper to enforce rate limits
 */
export function createRateLimitHeaders(result: ReturnType<typeof checkShopRateLimit>) {
  return {
    'X-RateLimit-Limit': result.remaining.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  };
}

export default rateLimiter;
