// Prisma Client Singleton with Performance Optimization

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 🚀 Create Prisma client with optimized settings
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // Disable query logging for better performance (only log errors)
    log: ['error'],
    
    // Connection pool optimization (configured in DATABASE_URL)
    // Add to your DATABASE_URL: ?connection_limit=10&pool_timeout=20&connect_timeout=10
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// 🚀 Enable connection pooling middleware for faster queries
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  
  // Log slow queries (> 1 second) for monitoring
  if (after - before > 1000) {
    console.warn(`⚠️ Slow query detected: ${params.model}.${params.action} took ${after - before}ms`);
  }
  
  return result;
});

export default prisma;
