import { and, eq, inArray, isNull, or } from 'drizzle-orm';
import type { TenantClient } from '@/lib/db-types';
import { roles, rolePermissions } from '@/lib/db/schema';
import { ApiError } from '@/lib/api/errors';
import { ROLES } from './roles';
import {
  SYSTEM_ROLE_KEYS,
  SYSTEM_ROLE_TEMPLATES,
  fullGrants,
  grantsToRows,
  mergeGrants,
  normalizeGrants,
  rowsToGrants,
  studentFinanceLevel,
  type PermissionAction,
  type PermissionGrants,
  type PermissionResource,
  type StudentFinanceLevel,
  type SystemRoleKey,
} from './permissionCatalog';

type RoleClient = TenantClient;

/**
 * Les rôles d'un utilisateur sont stockés par NOM (User.roles). Un nom n'est unique qu'au
 * sein d'une organisation (@@unique([name, organizationId])) et Role/RolePermission ne sont
 * pas couverts par la RLS : toute résolution nom -> rôle doit donc être restreinte aux rôles
 * système et aux rôles de l'organisation courante, sinon un rôle homonyme d'une autre
 * organisation accorderait ses permissions.
 */
export function orgRoleScope(orgId: string) {
  return or(eq(roles.organizationId, orgId), and(eq(roles.isSystem, true), isNull(roles.organizationId)))!;
}

/** Permissions effectives de l'utilisateur de la requête (union de ses rôles). */
export class PermissionSet {
  constructor(
    readonly grants: PermissionGrants,
    readonly isAdmin = false
  ) {}

  can(resource: PermissionResource, action: PermissionAction): boolean {
    return this.grants[resource]?.[action] ?? false;
  }

  assert(resource: PermissionResource, action: PermissionAction): void {
    if (!this.can(resource, action)) {
      throw new ApiError(403, 'Permission insuffisante pour cette action.', 'FORBIDDEN');
    }
  }

  /** Niveau de visibilité des finances d'un étudiant : aucune, statut seulement, détail complet. */
  get studentFinance(): StudentFinanceLevel {
    return studentFinanceLevel(this.grants);
  }
}

/**
 * Résout les permissions d'un ensemble de noms de rôles. ADMIN a tous les droits par
 * construction (jamais lus en base). Pour un même nom, la copie propre à l'organisation
 * (rôle système adapté par l'organisation) prime sur le modèle global.
 */
export async function loadPermissions(tx: RoleClient, orgId: string, roleNames: string[]): Promise<PermissionSet> {
  if (roleNames.includes(ROLES.ADMIN)) return new PermissionSet(fullGrants(), true);
  if (roleNames.length === 0) return new PermissionSet(normalizeGrants({}));

  const foundRoles = await tx.select({
    id: roles.id,
    name: roles.name,
    organizationId: roles.organizationId,
  }).from(roles).where(and(inArray(roles.name, roleNames), orgRoleScope(orgId)));
  if (foundRoles.length === 0) return new PermissionSet(normalizeGrants({}));
  const permissionRows = await tx.select({
    roleId: rolePermissions.roleId,
    resource: rolePermissions.resource,
    canRead: rolePermissions.canRead,
    canWrite: rolePermissions.canWrite,
  }).from(rolePermissions).where(inArray(rolePermissions.roleId, foundRoles.map((role) => role.id)));
  const byRoleId = new Map<string, typeof permissionRows>();
  for (const row of permissionRows) {
    const rows = byRoleId.get(row.roleId) ?? [];
    rows.push(row);
    byRoleId.set(row.roleId, rows);
  }
  const byName = new Map<string, { name: string; organizationId: string | null; permissions: typeof permissionRows }>();
  for (const role of foundRoles) {
    const current = byName.get(role.name);
    if (!current || (current.organizationId === null && role.organizationId !== null)) {
      byName.set(role.name, { ...role, permissions: byRoleId.get(role.id) ?? [] });
    }
  }
  return new PermissionSet(mergeGrants(Array.from(byName.values()).map((r) => rowsToGrants(r.permissions))));
}

export async function hasPermission(
  tx: RoleClient,
  orgId: string,
  roles: string[],
  resource: PermissionResource,
  action: PermissionAction
): Promise<boolean> {
  return (await loadPermissions(tx, orgId, roles)).can(resource, action);
}

/** Jeu de permissions d'origine d'un rôle système (voir SYSTEM_ROLE_TEMPLATES). */
export function systemTemplateGrants(key: SystemRoleKey): PermissionGrants {
  return normalizeGrants(SYSTEM_ROLE_TEMPLATES[key].grants);
}

/**
 * Crée dans l'organisation sa copie modifiable des rôles système (GESTIONNAIRE, COMPTABLE)
 * si elle n'existe pas encore. Idempotent : appelé à la création de l'organisation et en
 * filet de sécurité à la lecture des rôles.
 */
export async function ensureOrgSystemRoles(tx: RoleClient, orgId: string): Promise<void> {
  const existing = await tx.select({ name: roles.name }).from(roles)
    .where(and(eq(roles.organizationId, orgId), inArray(roles.name, [...SYSTEM_ROLE_KEYS])));
  const present = new Set(existing.map((r) => r.name));
  for (const key of SYSTEM_ROLE_KEYS) {
    if (present.has(key)) continue;
    const [created] = await tx.insert(roles).values({
      name: key,
      systemKey: key,
      isSystem: true,
      description: SYSTEM_ROLE_TEMPLATES[key].description,
      organizationId: orgId,
    }).returning({ id: roles.id });
    if (created) {
      const permissions = grantsToRows(systemTemplateGrants(key));
      if (permissions.length) {
        await tx.insert(rolePermissions).values(permissions.map((permission) => ({
          ...permission,
          roleId: created.id,
        })));
      }
    }
  }
}

/**
 * Anti-escalade : un utilisateur non administrateur ne peut attribuer (création ou
 * modification d'un compte) que des rôles dont les permissions sont incluses dans les siennes.
 * Sans cette règle, un rôle autorisé à gérer les comptes pourrait créer un compte ADMIN.
 */
export async function assertCanAssignRoles(
  tx: RoleClient,
  orgId: string,
  actor: PermissionSet,
  roleNames: string[]
): Promise<void> {
  if (actor.isAdmin) return;
  const target = await loadPermissions(tx, orgId, roleNames);
  const exceeds =
    target.isAdmin ||
    (Object.keys(target.grants) as PermissionResource[]).some(
      (r) => (target.grants[r].read && !actor.grants[r].read) || (target.grants[r].write && !actor.grants[r].write)
    );
  if (exceeds) {
    throw new ApiError(403, 'Vous ne pouvez pas attribuer un rôle qui dépasse vos propres droits.', 'ROLE_ESCALATION');
  }
}
