import { ApiError } from '@/lib/api/errors';
import type { TenantClient } from '@/lib/db-types';
import { orgRoleScope } from '@/lib/auth/permissions';
import { and, eq, inArray } from 'drizzle-orm';
import { centers, roles } from '@/lib/db/schema';

/**
 * Défense couche 1 (backend.md) : vérifie explicitement qu'une ressource appartient à
 * l'organisation courante avant de la muter par id, même si les clés étrangères ignorent la RLS.
 * RLS reste le filet de sécurité (couche 2) si ce filtre était oublié ailleurs.
 *
 * Usage: vérifier l'organisation dans la requête Drizzle avant toute mutation par id.
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
 * Indispensable avant de créer des liens : les contrôles de clé étrangère Postgres
 * ignorent la RLS, et la RLS elle-même n'est pas active quand le runtime tourne avec un
 * rôle BYPASSRLS (environnement local).
 */
export async function assertOrgCenters(tx: TenantClient, orgId: string, centerIds: string[]): Promise<void> {
  const unique = Array.from(new Set(centerIds));
  if (unique.length === 0) return;
  const found = await tx.select({ id: centers.id }).from(centers).where(
    and(inArray(centers.id, unique), eq(centers.organizationId, orgId))
  );
  if (found.length !== unique.length) {
    throw new ApiError(400, 'Un ou plusieurs centres sont introuvables.', 'CENTER_NOT_FOUND');
  }
}

/** Vérifie que chaque nom de rôle existe parmi les rôles système ou ceux de l'organisation. */
export async function assertOrgRoles(tx: TenantClient, orgId: string, roleNames: string[]): Promise<void> {
  const unique = Array.from(new Set(roleNames));
  if (unique.length === 0) return;
  const found = await tx.select({ name: roles.name }).from(roles)
    .where(and(inArray(roles.name, unique), orgRoleScope(orgId)));
  const known = new Set(found.map((r) => r.name));
  const missing = unique.filter((name) => !known.has(name));
  if (missing.length > 0) {
    throw new ApiError(400, `Rôle(s) inconnu(s) : ${missing.join(', ')}.`, 'ROLE_NOT_FOUND');
  }
}
