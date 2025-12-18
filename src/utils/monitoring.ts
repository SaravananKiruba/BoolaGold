/**
 * 🔍 Application Performance Monitoring for Multi-Tenant SaaS
 * 
 * CRITICAL METRICS for 300+ shops:
 * 1. Per-shop performance (identify slow shops)
 * 2. Database query time (N+1 detection)
 * 3. API response time (SLA monitoring)
 * 4. Error rates by shop
 * 5. Subscription renewals
 * 
 * PRODUCTION: Integrate with Datadog, New Relic, or Sentry
 */

interface PerformanceMetric {
  shopId: string;
  operation: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

interface HealthMetrics {
  totalShops: number;
  activeShops: number;
  trialShops: number;
  expiredTrials: number;
  expiredAMCs: number;
  avgResponseTime: number;
  errorRate: number;
  dbConnectionPool: {
    active: number;
    idle: number;
    waiting: number;
  };
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 10000; // Keep last 10k metrics in memory

  /**
   * Track operation performance
   */
  async track<T>(
    shopId: string,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    let success = true;
    let errorMessage: string | undefined;

    try {
      const result = await fn();
      return result;
    } catch (error: any) {
      success = false;
      errorMessage = error.message;
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      this.recordMetric({
        shopId,
        operation,
        duration,
        timestamp: new Date(),
        success,
        errorMessage,
      });

      // Alert on slow operations (>5 seconds)
      if (duration > 5000) {
        console.warn(`⚠️ SLOW OPERATION: ${operation} for shop ${shopId} took ${duration}ms`);
      }
    }
  }

  /**
   * Record metric
   */
  private recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // Limit memory usage
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    // Log to external monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to Datadog/New Relic
      // datadog.increment('api.request', { shop_id: metric.shopId, operation: metric.operation });
    }
  }

  /**
   * Get metrics for specific shop
   */
  getShopMetrics(shopId: string, minutes: number = 5): PerformanceMetric[] {
    const cutoff = Date.now() - minutes * 60 * 1000;
    return this.metrics.filter(
      (m) => m.shopId === shopId && m.timestamp.getTime() > cutoff
    );
  }

  /**
   * Get slow operations across all shops
   */
  getSlowOperations(thresholdMs: number = 1000): PerformanceMetric[] {
    return this.metrics.filter((m) => m.duration > thresholdMs);
  }

  /**
   * Get error rate by shop
   */
  getErrorRate(shopId: string, minutes: number = 60): number {
    const metrics = this.getShopMetrics(shopId, minutes);
    if (metrics.length === 0) return 0;

    const errors = metrics.filter((m) => !m.success).length;
    return (errors / metrics.length) * 100;
  }

  /**
   * Get average response time by operation
   */
  getAvgResponseTime(operation: string, minutes: number = 15): number {
    const cutoff = Date.now() - minutes * 60 * 1000;
    const relevant = this.metrics.filter(
      (m) => m.operation === operation && m.timestamp.getTime() > cutoff
    );

    if (relevant.length === 0) return 0;

    const total = relevant.reduce((sum, m) => sum + m.duration, 0);
    return total / relevant.length;
  }

  /**
   * Clear old metrics
   */
  clearOld(hours: number = 24) {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    this.metrics = this.metrics.filter((m) => m.timestamp.getTime() > cutoff);
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Health check endpoint data
 */
export async function getHealthMetrics(): Promise<HealthMetrics> {
  const prisma = (await import('@/lib/prisma')).default;

  // Execute all checks in parallel
  const [
    totalShops,
    activeShops,
    trialShops,
    expiredTrials,
    expiredAMCs,
  ] = await Promise.all([
    prisma.shop.count({ where: { deletedAt: null } }),
    prisma.shop.count({ where: { isActive: true, deletedAt: null } }),
    prisma.shop.count({ where: { subscriptionType: 'TRIAL', deletedAt: null } }),
    prisma.shop.count({
      where: {
        subscriptionType: 'TRIAL',
        trialEndDate: { lt: new Date() },
        deletedAt: null,
      },
    }),
    prisma.shop.count({
      where: {
        amcRenewalDate: { lt: new Date() },
        deletedAt: null,
      },
    }),
  ]);

  // Calculate avg response time (last 15 min)
  const avgResponseTime = performanceMonitor.getAvgResponseTime('api.request', 15);

  // Calculate error rate (last hour)
  const errorRate = 0; // TODO: Implement global error rate

  return {
    totalShops,
    activeShops,
    trialShops,
    expiredTrials,
    expiredAMCs,
    avgResponseTime: Math.round(avgResponseTime),
    errorRate,
    dbConnectionPool: {
      active: 0, // TODO: Get from Prisma metrics
      idle: 0,
      waiting: 0,
    },
  };
}

/**
 * Alert system for critical issues
 */
export class AlertManager {
  /**
   * Alert on expired AMCs (should auto-deactivate shops)
   */
  async checkExpiredAMCs() {
    const prisma = (await import('@/lib/prisma')).default;
    
    const expired = await prisma.shop.findMany({
      where: {
        amcRenewalDate: { lt: new Date() },
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        amcRenewalDate: true,
        phone: true,
        email: true,
      },
    });

    if (expired.length > 0) {
      console.error(`🚨 ALERT: ${expired.length} shops have expired AMC but are still active`);
      
      // TODO: Send email/SMS notifications
      // TODO: Auto-deactivate after grace period
      
      return expired;
    }

    return [];
  }

  /**
   * Alert on trial expiry (7 days before)
   */
  async checkExpiringTrials() {
    const prisma = (await import('@/lib/prisma')).default;
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiring = await prisma.shop.findMany({
      where: {
        subscriptionType: 'TRIAL',
        trialEndDate: {
          gte: new Date(),
          lte: sevenDaysFromNow,
        },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        trialEndDate: true,
        phone: true,
        email: true,
      },
    });

    if (expiring.length > 0) {
      console.warn(`⚠️ ${expiring.length} trials expiring in next 7 days`);
      // TODO: Send renewal reminders
    }

    return expiring;
  }

  /**
   * Alert on high error rates for specific shop
   */
  checkShopHealth(shopId: string) {
    const errorRate = performanceMonitor.getErrorRate(shopId, 60);
    
    if (errorRate > 10) {
      console.error(`🚨 HIGH ERROR RATE: Shop ${shopId} has ${errorRate.toFixed(1)}% errors`);
      // TODO: Alert support team
    }
  }
}

export const alertManager = new AlertManager();

/**
 * Middleware to track API performance
 */
export function createPerformanceMiddleware() {
  return async (shopId: string, operation: string, handler: () => Promise<any>) => {
    return performanceMonitor.track(shopId, operation, handler);
  };
}
