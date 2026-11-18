import { PrismaClient } from '@prisma/client';

const globalForAuthPrisma = globalThis as unknown as { authPrisma: PrismaClient };

/**
 * Client Prisma dédié exclusivement à l'authentification.
 * Ce client se connecte à la base de données avec le rôle `app_auth`
 * via la variable d'environnement `AUTH_DATABASE_URL`.
 * 
 * Ce rôle possède uniquement des droits de LECTURE sur la table `User`
 * et ignore la politique de Row Level Security (RLS) tenant_isolation,
 * car lors du login, l'identifiant de l'organisation n'est pas encore connu.
 */
export const authPrisma =
  globalForAuthPrisma.authPrisma || new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL, // Surcharge provisoire vers l'URL principale suite aux timeouts du pooler Supabase sur app_auth
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForAuthPrisma.authPrisma = authPrisma;
