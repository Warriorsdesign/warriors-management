import { PrismaClient } from '@prisma/client';

const globalForAdminPrisma = globalThis as unknown as { adminPrisma: PrismaClient };

/**
 * Client Prisma dédié exclusivement aux opérations du Back-Office Super Administrateur.
 * Se connecte via DIRECT_URL (rôle administrateur avec BYPASSRLS) pour permettre
 * l'agrégation globale de données multi-tenant (toutes organisations, utilisateurs, audit).
 */
export const adminPrisma =
  globalForAdminPrisma.adminPrisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_URL || process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForAdminPrisma.adminPrisma = adminPrisma;
