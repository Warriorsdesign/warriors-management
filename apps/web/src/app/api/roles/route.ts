export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { ApiError } from '@/lib/api/errors';
import { ROLES } from '@/lib/auth/roles';
import { ensureOrgSystemRoles } from '@/lib/auth/permissions';
import { grantsToRows } from '@/lib/auth/permissionCatalog';
import { auditRoleEvent, countUsersByRole, inputToGrants, toRoleDTO } from '@/lib/business/roles';
import { createRoleSchema } from '@/lib/validation/roles';
import { roles, rolePermissions } from '@/lib/db/schema';
import { and, eq, or, asc } from 'drizzle-orm';

export const GET = withApiRoute(async (_req, { tx, orgId }) => {
  await ensureOrgSystemRoles(tx, orgId);
  const rows = await tx.select().from(roles).where(or(eq(roles.organizationId, orgId), and(eq(roles.name, ROLES.ADMIN), eq(roles.isSystem, true), eq(roles.organizationId, null as never)))).orderBy(asc(roles.createdAt));
  const counts = await countUsersByRole(tx, orgId);
  const data = await Promise.all(rows.map(async (role) => {
    const permissions = await tx.select().from(rolePermissions).where(eq(rolePermissions.roleId, role.id));
    return toRoleDTO({ ...role, permissions }, counts.get(role.name) ?? 0);
  }));
  return NextResponse.json(data);
}, { permission: { resource: 'users', action: 'read' } });

export const POST = withApiRoute(async (req, { tx, orgId, userId }) => {
  const body = createRoleSchema.parse(await req.json());
  const name = body.name.toUpperCase();
  const [existing] = await tx.select().from(roles).where(and(eq(roles.name, name), or(eq(roles.organizationId, orgId), and(eq(roles.isSystem, true), eq(roles.organizationId, null as never))))).limit(1);
  if (existing) throw new ApiError(409, 'Un rôle avec ce nom existe déjà.', 'ROLE_EXISTS');
  const [newRole] = await tx.insert(roles).values({ name, description: body.description || null, isSystem: false, organizationId: orgId }).returning();
  const grantRows = grantsToRows(inputToGrants(body.permissions));
  await Promise.all(grantRows.map((grant) => tx.insert(rolePermissions).values({ roleId: newRole.id, resource: grant.resource, canRead: grant.canRead, canWrite: grant.canWrite })));
  await auditRoleEvent(tx, orgId, userId, 'CREATE_ROLE', newRole);
  const permissions = await tx.select().from(rolePermissions).where(eq(rolePermissions.roleId, newRole.id));
  return NextResponse.json(toRoleDTO({ ...newRole, permissions }, 0), { status: 201 });
}, { allowedRoles: [ROLES.ADMIN] });
