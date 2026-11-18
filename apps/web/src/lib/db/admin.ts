import { PrismaClient } from '@prisma/client';

const globalForAdminPrisma = globalThis as unknown as { adminPrisma: PrismaClient };

const adminDatabaseUrl = process.env.DIRECT_URL;

if (!adminDatabaseUrl) {
  throw new Error(
    'Configuration Prisma manquante : définissez DIRECT_URL dans apps/web/.env. ' +
      'Le client admin doit utiliser une connexion PostgreSQL privilégiée séparée.'
  );
}

/**
 * Client Prisma dédié exclusivement aux opérations du Back-Office Super Administrateur.
 * Se connecte via DIRECT_URL (rôle administrateur avec BYPASSRLS) pour permettre
 * l'agrégation globale de données multi-tenant (toutes organisations, utilisateurs, audit).
 */
export const adminPrisma =
  globalForAdminPrisma.adminPrisma ||
  new PrismaClient({
    datasources: {
      db: { url: adminDatabaseUrl },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForAdminPrisma.adminPrisma = adminPrisma;
