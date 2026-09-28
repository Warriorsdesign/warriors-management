import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { ApiError } from '@/lib/api/errors';
import { ROLES } from '@/lib/auth/roles';
import { systemTemplateGrants } from '@/lib/auth/permissions';
import { SYSTEM_ROLE_TEMPLATES, grantsToRows, isSystemRoleKey } from '@/lib/auth/permissionCatalog';
import { auditRoleEvent, countUsersByRole, findEditableRole, toRoleDTO } from '@/lib/business/roles';

/** "Rétablir les réglages d'origine" d'un rôle système copié dans l'organisation. */
export const POST = withApiRoute<{ id: string }>(async (_req, { tx, orgId, userId, params }) => {
  const role = await findEditableRole(tx, orgId, params.id);
  if (!isSystemRoleKey(role.systemKey)) {
    throw new ApiError(400, 'Seuls les rôles système peuvent être rétablis.', 'NOT_SYSTEM_ROLE');
  }

  const updated = await tx.role.update({
    where: { id: role.id },
    data: {
      description: SYSTEM_ROLE_TEMPLATES[role.systemKey].description,
      permissions: { deleteMany: {}, create: grantsToRows(systemTemplateGrants(role.systemKey)) },
    },
    include: { permissions: true },
  });
  await auditRoleEvent(tx, orgId, userId, 'RESET_ROLE', updated);

  const counts = await countUsersByRole(tx, orgId);
  return NextResponse.json(toRoleDTO(updated, counts.get(updated.name) ?? 0));
}, { allowedRoles: [ROLES.ADMIN] });
