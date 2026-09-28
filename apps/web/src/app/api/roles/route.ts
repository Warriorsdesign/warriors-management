import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { ApiError } from '@/lib/api/errors';
import { ROLES } from '@/lib/auth/roles';
import { ensureOrgSystemRoles, orgRoleScope } from '@/lib/auth/permissions';
import { grantsToRows } from '@/lib/auth/permissionCatalog';
import { auditRoleEvent, countUsersByRole, inputToGrants, toRoleDTO } from '@/lib/business/roles';
import { createRoleSchema } from '@/lib/validation/roles';

/**
 * Rôles de l'organisation : ADMIN (global, verrouillé), copies modifiables des rôles système
 * (GESTIONNAIRE, COMPTABLE) et rôles créés par l'organisation. Les modèles globaux des rôles
 * système ne sont jamais renvoyés : chaque organisation travaille sur sa copie.
 */
export const GET = withApiRoute(async (_req, { tx, orgId }) => {
  await ensureOrgSystemRoles(tx, orgId);
  const [roles, counts] = await Promise.all([
    tx.role.findMany({
      where: { OR: [{ organizationId: orgId }, { name: ROLES.ADMIN, isSystem: true, organizationId: null }] },
      include: { permissions: true },
      orderBy: { createdAt: 'asc' },
    }),
    countUsersByRole(tx, orgId),
  ]);

  const rank = (r: (typeof roles)[number]) => (r.organizationId === null ? 0 : r.systemKey ? 1 : 2);
  const sorted = [...roles].sort((a, b) => rank(a) - rank(b) || a.createdAt.getTime() - b.createdAt.getTime());
  return NextResponse.json(sorted.map((r) => toRoleDTO(r, counts.get(r.name) ?? 0)));
}, { permission: { resource: 'users', action: 'read' } });

export const POST = withApiRoute(async (req, { tx, orgId, userId }) => {
  const body = createRoleSchema.parse(await req.json());
  const name = body.name.toUpperCase();

  const existingRole = await tx.role.findFirst({ where: { name, ...orgRoleScope(orgId) } });
  if (existingRole) {
    throw new ApiError(409, 'Un rôle avec ce nom existe déjà.', 'ROLE_EXISTS');
  }

  const newRole = await tx.role.create({
    data: {
      name,
      description: body.description || null,
      isSystem: false,
      organizationId: orgId,
      permissions: { create: grantsToRows(inputToGrants(body.permissions)) },
    },
    include: { permissions: true },
  });

  await auditRoleEvent(tx, orgId, userId, 'CREATE_ROLE', newRole);

  return NextResponse.json(toRoleDTO(newRole, 0), { status: 201 });
}, { allowedRoles: [ROLES.ADMIN] });
