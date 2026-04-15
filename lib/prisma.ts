/**
 * Prisma Client Singleton
 * 
 * In development, Next.js hot-reloads modules frequently.
 * Without a singleton, each reload creates a new PrismaClient instance,
 * exhausting database connections. This pattern caches the client on `globalThis`.
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
