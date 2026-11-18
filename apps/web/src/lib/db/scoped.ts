import { ApiError } from '@/lib/api/errors';
import type { TenantClient } from '@/lib/db';
import { orgRoleScope } from '@/lib/auth/permissions';

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

/**
 * Vérifie que tous les centres référencés appartiennent à l'organisation courante.
 * Indispensable avant un `connect`/`set` Prisma : les contrôles de clé étrangère Postgres
 * ignorent la RLS, et la RLS elle-même n'est pas active quand le runtime tourne avec un
 * rôle BYPASSRLS (environnement local).
 */
export async function assertOrgCenters(tx: TenantClient, orgId: string, centerIds: string[]): Promise<void> {
  const unique = Array.from(new Set(centerIds));
  if (unique.length === 0) return;
  const count = await tx.center.count({ where: { id: { in: unique }, organizationId: orgId } });
  if (count !== unique.length) {
    throw new ApiError(400, 'Un ou plusieurs centres sont introuvables.', 'CENTER_NOT_FOUND');
  }
}

/** Vérifie que chaque nom de rôle existe parmi les rôles système ou ceux de l'organisation. */
export async function assertOrgRoles(tx: TenantClient, orgId: string, roleNames: string[]): Promise<void> {
  const unique = Array.from(new Set(roleNames));
  if (unique.length === 0) return;
  const found = await tx.role.findMany({
    where: { name: { in: unique }, ...orgRoleScope(orgId) },
    select: { name: true },
  });
  const known = new Set(found.map((r) => r.name));
  const missing = unique.filter((name) => !known.has(name));
  if (missing.length > 0) {
    throw new ApiError(400, `Rôle(s) inconnu(s) : ${missing.join(', ')}.`, 'ROLE_NOT_FOUND');
  }
}
