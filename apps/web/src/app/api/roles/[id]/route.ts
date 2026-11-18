import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { ApiError } from '@/lib/api/errors';
import { ROLES } from '@/lib/auth/roles';
import { orgRoleScope } from '@/lib/auth/permissions';
import { grantsToRows } from '@/lib/auth/permissionCatalog';
import { auditRoleEvent, countUsersByRole, findEditableRole, inputToGrants, toRoleDTO } from '@/lib/business/roles';
import { updateRoleSchema } from '@/lib/validation/roles';

/**
 * Modification d'un rôle de l'organisation (ADMIN uniquement). Les rôles système copiés dans
 * l'organisation (GESTIONNAIRE, COMPTABLE) gardent leur nom mais leurs permissions sont
 * modifiables. Le changement s'applique dès la requête suivante des utilisateurs concernés :
 * les permissions sont relues en base à chaque appel.
 */
export const PUT = withApiRoute<{ id: string }>(async (req, { tx, orgId, userId, params }) => {
  const role = await findEditableRole(tx, orgId, params.id);
  const body = updateRoleSchema.parse(await req.json());

  const newName = body.name?.toUpperCase();
  if (newName && newName !== role.name) {
    if (role.systemKey) {
      throw new ApiError(400, 'Le nom d\'un rôle système ne peut pas être modifié.', 'ROLE_NAME_LOCKED');
    }
    const duplicate = await tx.role.findFirst({ where: { name: newName, id: { not: role.id }, ...orgRoleScope(orgId) } });
    if (duplicate) {
      throw new ApiError(409, 'Un rôle avec ce nom existe déjà.', 'ROLE_EXISTS');
    }
    // Les utilisateurs référencent leurs rôles par nom : le renommage est reporté sur leurs comptes.
    await tx.$executeRaw`
      UPDATE "User" SET "roles" = array_replace("roles", ${role.name}, ${newName}), "updatedAt" = NOW()
      WHERE "organizationId" = ${orgId} AND ${role.name} = ANY("roles")`;
  }

  const updated = await tx.role.update({
    where: { id: role.id },
    data: {
      name: newName && !role.systemKey ? newName : undefined,
      description: body.description !== undefined ? body.description || null : undefined,
      permissions: body.permissions
        ? { deleteMany: {}, create: grantsToRows(inputToGrants(body.permissions)) }
        : undefined,
    },
    include: { permissions: true },
  });

  await auditRoleEvent(tx, orgId, userId, 'UPDATE_ROLE', updated, newName && newName !== role.name ? { previousName: role.name } : {});

  const counts = await countUsersByRole(tx, orgId);
  return NextResponse.json(toRoleDTO(updated, counts.get(updated.name) ?? 0));
}, { allowedRoles: [ROLES.ADMIN] });

export const DELETE = withApiRoute<{ id: string }>(async (_req, { tx, orgId, userId, params }) => {
  const role = await findEditableRole(tx, orgId, params.id);
  if (role.isSystem) {
    throw new ApiError(403, 'Un rôle système ne peut pas être supprimé.', 'ROLE_LOCKED');
  }

  const usersWithRole = await tx.user.count({ where: { organizationId: orgId, roles: { has: role.name } } });
  if (usersWithRole > 0) {
    throw new ApiError(
      409,
      `Impossible de supprimer ce rôle : il est attribué à ${usersWithRole} utilisateur${usersWithRole > 1 ? 's' : ''}.`,
      'ROLE_IN_USE'
    );
  }

  await tx.role.delete({ where: { id: role.id } });
  await auditRoleEvent(tx, orgId, userId, 'DELETE_ROLE', role);

  return NextResponse.json({ success: true });
}, { allowedRoles: [ROLES.ADMIN] });
