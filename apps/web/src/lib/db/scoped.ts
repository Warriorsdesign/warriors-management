import { ApiError } from '@/lib/api/errors';

/**
 * Défense couche 1 (backend.md) : vérifie explicitement qu'une ressource appartient à
 * l'organisation courante avant de la muter par id (Prisma update/delete n'acceptent
 * qu'un where unique, donc pas de filtre organizationId direct sur ces opérations).
 * RLS reste le filet de sécurité (couche 2) si ce filtre était oublié ailleurs.
 *
 * Usage: const formation = await findOrgScopedOrThrow(() =>
 *   tx.formation.findFirst({ where: { id: params.id, organizationId: ctx.orgId } }));
 */
export async function findOrgScopedOrThrow<T>(
  finder: () => Promise<T | null>,
  message = 'Resource not found'
): Promise<T> {
  const result = await finder();
  if (!result) throw new ApiError(404, message, 'NOT_FOUND');
  return result;
}
