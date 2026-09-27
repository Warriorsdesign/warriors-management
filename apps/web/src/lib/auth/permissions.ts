import type { TenantClient } from '@/lib/db';

/**
 * Les rôles d'un utilisateur sont stockés par NOM (User.roles). Un nom n'est unique qu'au
 * sein d'une organisation (@@unique([name, organizationId])) et Role/RolePermission ne sont
 * pas couverts par la RLS : toute résolution nom -> rôle doit donc être restreinte aux rôles
 * système et aux rôles de l'organisation courante, sinon un rôle homonyme d'une autre
 * organisation accorderait ses permissions.
 */
export function orgRoleScope(orgId: string) {
  return {
    OR: [{ organizationId: orgId }, { isSystem: true, organizationId: null }],
  };
}

export async function hasPermission(
  tx: TenantClient,
  orgId: string,
  roles: string[],
  resource: string,
  action: 'read' | 'write'
): Promise<boolean> {
  if (roles.length === 0) return false;
  const perm = await tx.rolePermission.findFirst({
    where: {
      role: { name: { in: roles }, ...orgRoleScope(orgId) },
      resource,
      ...(action === 'read' ? { canRead: true } : { canWrite: true }),
    },
    select: { id: true },
  });
  return perm !== null;
}
