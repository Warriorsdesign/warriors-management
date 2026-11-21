export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { ApiError } from '@/lib/api/errors';
import { ROLES } from '@/lib/auth/roles';
import { systemTemplateGrants } from '@/lib/auth/permissions';
import { SYSTEM_ROLE_TEMPLATES, grantsToRows, isSystemRoleKey } from '@/lib/auth/permissionCatalog';
import { auditRoleEvent, countUsersByRole, findEditableRole, toRoleDTO } from '@/lib/business/roles';
import { rolePermissions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const POST = withApiRoute<{ id: string }>(async (_req, { tx, orgId, userId, params }) => {
  const role = await findEditableRole(tx, orgId, params.id);
  if (!isSystemRoleKey(role.systemKey)) throw new ApiError(400, 'Seuls les rôles système peuvent être rétablis.', 'NOT_SYSTEM_ROLE');
  const grantRows = grantsToRows(systemTemplateGrants(role.systemKey));
  await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));
  await Promise.all(grantRows.map((grant) => tx.insert(rolePermissions).values({ roleId: role.id, resource: grant.resource, canRead: grant.canRead, canWrite: grant.canWrite })));
  await auditRoleEvent(tx, orgId, userId, 'RESET_ROLE', role);
  const counts = await countUsersByRole(tx, orgId);
  const permissions = await tx.select().from(rolePermissions).where(eq(rolePermissions.roleId, role.id));
  return NextResponse.json(toRoleDTO({ ...role, permissions, description: SYSTEM_ROLE_TEMPLATES[role.systemKey].description }, counts.get(role.name) ?? 0));
}, { allowedRoles: [ROLES.ADMIN] });
