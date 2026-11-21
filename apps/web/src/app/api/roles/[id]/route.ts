export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { ApiError } from '@/lib/api/errors';
import { ROLES } from '@/lib/auth/roles';
import { grantsToRows } from '@/lib/auth/permissionCatalog';
import { auditRoleEvent, countUsersByRole, findEditableRole, inputToGrants, toRoleDTO } from '@/lib/business/roles';
import { updateRoleSchema } from '@/lib/validation/roles';
import { roles, rolePermissions, users } from '@/lib/db/schema';
import { and, eq, sql, count } from 'drizzle-orm';

export const PUT = withApiRoute<{ id: string }>(async (req, { tx, orgId, userId, params }) => {
  const role = await findEditableRole(tx, orgId, params.id);
  const body = updateRoleSchema.parse(await req.json());
  const newName = body.name?.toUpperCase();
  if (newName && newName !== role.name) {
    if (role.systemKey) throw new ApiError(400, "Le nom d'un rôle système ne peut pas être modifié.", 'ROLE_NAME_LOCKED');
    const [duplicate] = await tx.select().from(roles).where(and(eq(roles.name, newName), eq(roles.organizationId, orgId))).limit(1);
    if (duplicate) throw new ApiError(409, 'Un rôle avec ce nom existe déjà.', 'ROLE_EXISTS');
    await tx.execute(sql`UPDATE "User" SET "roles" = array_replace("roles", ${role.name}, ${newName}), "updatedAt" = NOW() WHERE "organizationId" = ${orgId} AND ${role.name} = ANY("roles")`);
  }
  const [updated] = await tx.update(roles).set({ name: newName && !role.systemKey ? newName : role.name, description: body.description !== undefined ? body.description || null : role.description }).where(eq(roles.id, role.id)).returning();
  if (body.permissions) {
    await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));
    await Promise.all(grantsToRows(inputToGrants(body.permissions)).map((grant) => tx.insert(rolePermissions).values({ roleId: role.id, resource: grant.resource, canRead: grant.canRead, canWrite: grant.canWrite })));
  }
  await auditRoleEvent(tx, orgId, userId, 'UPDATE_ROLE', updated, newName && newName !== role.name ? { previousName: role.name } : {});
  const counts = await countUsersByRole(tx, orgId);
  const permissions = await tx.select().from(rolePermissions).where(eq(rolePermissions.roleId, role.id));
  return NextResponse.json(toRoleDTO({ ...updated, permissions }, counts.get(updated.name) ?? 0));
}, { allowedRoles: [ROLES.ADMIN] });

export const DELETE = withApiRoute<{ id: string }>(async (_req, { tx, orgId, userId, params }) => {
  const role = await findEditableRole(tx, orgId, params.id);
  if (role.isSystem) throw new ApiError(403, 'Un rôle système ne peut pas être supprimé.', 'ROLE_LOCKED');
  const [row] = await tx.select({ value: count() }).from(users).where(and(eq(users.organizationId, orgId), sql`${role.name} = ANY(${users.roles})`));
  const usersWithRole = Number(row?.value ?? 0);
  if (usersWithRole > 0) throw new ApiError(409, `Impossible de supprimer ce rôle : il est attribué à ${usersWithRole} utilisateur${usersWithRole > 1 ? 's' : ''}.`, 'ROLE_IN_USE');
  await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));
  await tx.delete(roles).where(eq(roles.id, role.id));
  await auditRoleEvent(tx, orgId, userId, 'DELETE_ROLE', role);
  return NextResponse.json({ success: true });
}, { allowedRoles: [ROLES.ADMIN] });
