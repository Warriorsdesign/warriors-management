import { PrismaClient } from '@prisma/client';

const globalForAdminPrisma = globalThis as unknown as { adminPrisma?: PrismaClient };

function getAdminPrisma(): PrismaClient {
  if (globalForAdminPrisma.adminPrisma) return globalForAdminPrisma.adminPrisma;

  const adminDatabaseUrl = process.env.DIRECT_URL;
  if (!adminDatabaseUrl) {
    throw new Error(
      'Configuration Prisma manquante : définissez DIRECT_URL dans les variables d’environnement. ' +
        'Le client admin doit utiliser une connexion PostgreSQL privilégiée séparée.'
    );
  }

  globalForAdminPrisma.adminPrisma = new PrismaClient({
    datasources: {
      db: { url: adminDatabaseUrl },
    },
  });
  return globalForAdminPrisma.adminPrisma;
}

/**
 * Client Prisma dédié exclusivement aux opérations du Back-Office Super Administrateur.
 * Se connecte via DIRECT_URL (rôle administrateur avec BYPASSRLS) pour permettre
 * l'agrégation globale de données multi-tenant (toutes organisations, utilisateurs, audit).
 */
export const adminPrisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getAdminPrisma();
    const value = Reflect.get(client, property, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
