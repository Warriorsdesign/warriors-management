import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const basePrisma =
  globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = basePrisma;

/** Le client Prisma scopé à une transaction, tel que reçu par le callback de withTenantContext. */
export type TenantClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

/**
 * Exécute une série de requêtes Prisma au sein d'une transaction sécurisée par RLS.
 * L'identifiant de l'organisation est injecté dans le contexte de la session PostgreSQL
 * pour garantir l'isolation des locataires (Tenant Isolation).
 *
 * @param orgId L'identifiant de l'organisation (issu du JWT)
 * @param callback La fonction contenant les requêtes Prisma à exécuter
 */
export async function withTenantContext<T>(
  orgId: string,
  callback: (tx: TenantClient) => Promise<T>,
  options?: { timeout?: number }
): Promise<T> {
  if (!orgId) {
    throw new Error('Tenant context requires an organization ID.');
  }

  return await basePrisma.$transaction(async (tx) => {
    // Keep the organization context local to this transaction for PostgreSQL RLS.
    await tx.$executeRawUnsafe(`SELECT set_config('app.org_id', $1, true)`, orgId);

    // Execute the callback with the transaction object
    const result = await callback(tx);

    return result;
  }, {
    // Allow time for local PostgreSQL and hosted connection pools to acquire a connection.
    maxWait: 10000,
    // Surchargeable pour les traitements de masse (import Excel).
    timeout: options?.timeout ?? 15000,
  });
}
