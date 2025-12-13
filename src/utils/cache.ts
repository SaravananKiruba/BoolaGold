/**
 * 🚀 Simple In-Memory Cache for Performance Optimization
 * 
 * Caches frequently accessed data to reduce database queries
 * - Rate Master data (changes rarely)
 * - Product lookups by barcode
 * - Shop configuration
 * 
 * For production with multiple servers, replace with Redis
 */

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number;

  constructor(defaultTTL = 300000) { // Default 5 minutes
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    
    // Clear expired entries every minute
    setInterval(() => this.clearExpired(), 60000);
  }

  /**
   * Get cached value
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Set cached value with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data, expiry });
  }

  /**
   * Delete specific key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Delete all keys matching pattern
   */
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  private clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  stats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const cache = new SimpleCache();

/**
 * Cache key generators for consistency
 */
export const CacheKeys = {
  rate: (shopId: string, metalType: string, purity: string) => 
    `rate:${shopId}:${metalType}:${purity}`,
  
  rateAll: (shopId: string) => 
    `rate:${shopId}:*`,
  
  product: (shopId: string, barcode: string) => 
    `product:${shopId}:${barcode}`,
  
  productById: (id: string) => 
    `product:id:${id}`,
  
  shopConfig: (shopId: string) => 
    `shop:${shopId}`,
};

/**
 * Helper function to get or fetch data with caching
 */
export async function cacheOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Try cache first
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  // Fetch from source
  const data = await fetchFn();
  
  // Store in cache
  cache.set(key, data, ttl);
  
  return data;
}
