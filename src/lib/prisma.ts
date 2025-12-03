// Prisma Client Singleton

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

// Only create Prisma client if DATABASE_URL is available
export const prisma =
  globalForPrisma.prisma ||
  (process.env.DATABASE_URL
    ? new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      })
    : undefined);

if (process.env.NODE_ENV !== 'production' && prisma) globalForPrisma.prisma = prisma;

export default prisma;
