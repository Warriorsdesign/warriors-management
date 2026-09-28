import type { TenantClient } from '@/lib/db';
import { ApiError } from '@/lib/api/errors';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import { ROLES } from '@/lib/auth/roles';
import {
  PERMISSION_RESOURCES,
  fullGrants,
  grantsToRows,
  normalizeGrants,
  rowsToGrants,
  type PartialPermissionGrants,
  type PermissionGrants,
} from '@/lib/auth/permissionCatalog';

type RoleRow = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  systemKey: string | null;
  organizationId: string | null;
  createdAt: Date;
  permissions: { resource: string; canRead: boolean; canWrite: boolean }[];
};

export interface RoleDTO {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  /** Rôle système adapté par l'organisation (GESTIONNAIRE, COMPTABLE) : nom figé, réinitialisable. */
  systemKey: string | null;
  /** ADMIN : tous les droits, non modifiable. */
  locked: boolean;
  permissions: { resource: string; canRead: boolean; canWrite: boolean }[];
  userCount: number;
  createdAt: string;
}

export function isAdminRole(role: Pick<RoleRow, 'name' | 'organizationId'>): boolean {
  return role.name === ROLES.ADMIN && role.organizationId === null;
}

export function toRoleDTO(role: RoleRow, userCount: number): RoleDTO {
  const locked = isAdminRole(role);
  const grants: PermissionGrants = locked ? fullGrants() : rowsToGrants(role.permissions);
  return {
    id: role.id,
    name: role.name,
    description: locked ? 'Tous les droits sur l\'organisation. Non modifiable.' : role.description,
    isSystem: role.isSystem,
    systemKey: role.systemKey,
    locked,
    permissions: grantsToRows(grants),
    userCount,
    createdAt: role.createdAt.toISOString(),
  };
}

/** Permissions saisies -> jeu cohérent (dépendances appliquées, droits réservés à ADMIN retirés). */
export function inputToGrants(rows: { resource: string; canRead: boolean; canWrite: boolean }[]): PermissionGrants {
  const partial: PartialPermissionGrants = {};
  for (const row of rows) {
    if (!(PERMISSION_RESOURCES as readonly string[]).includes(row.resource)) continue;
    partial[row.resource as keyof PartialPermissionGrants] = { read: row.canRead, write: row.canWrite };
  }
  return normalizeGrants(partial);
}

/** Nombre d'utilisateurs de l'organisation par nom de rôle. */
export async function countUsersByRole(tx: TenantClient, orgId: string): Promise<Map<string, number>> {
  const users = await tx.user.findMany({ where: { organizationId: orgId }, select: { roles: true } });
  const counts = new Map<string, number>();
  for (const u of users) for (const r of u.roles) counts.set(r, (counts.get(r) ?? 0) + 1);
  return counts;
}

/** Rôle modifiable de l'organisation (404 si inconnu ou d'une autre organisation, 403 pour ADMIN). */
export async function findEditableRole(tx: TenantClient, orgId: string, roleId: string) {
  const role = await tx.role.findUnique({ where: { id: roleId }, include: { permissions: true } });
  if (!role || (role.organizationId !== orgId && !isAdminRole(role))) {
    throw new ApiError(404, 'Rôle introuvable.', 'NOT_FOUND');
  }
  if (isAdminRole(role)) {
    throw new ApiError(403, 'Le rôle ADMIN a tous les droits et n\'est pas modifiable.', 'ROLE_LOCKED');
  }
  return role;
}

/** Journal d'audit des modifications de rôles (acteur = administrateur connecté). */
export async function auditRoleEvent(
  tx: TenantClient,
  orgId: string,
  userId: string,
  action: 'CREATE_ROLE' | 'UPDATE_ROLE' | 'RESET_ROLE' | 'DELETE_ROLE',
  role: { id: string; name: string },
  details: Record<string, unknown> = {}
): Promise<void> {
  const actor = await tx.user.findFirst({
    where: { id: userId, organizationId: orgId },
    select: { email: true, firstName: true, lastName: true },
  });
  await logAuditEvent({
    actorId: userId,
    actorEmail: actor?.email ?? '',
    actorName: actor ? `${actor.firstName} ${actor.lastName}` : '',
    action,
    resource: 'Role',
    resourceId: role.id,
    details: { organizationId: orgId, name: role.name, ...details },
  });
}
