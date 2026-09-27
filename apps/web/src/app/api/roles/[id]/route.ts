import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { ApiError } from '@/lib/api/errors';
import { logAuditEvent } from '@/lib/audit/audit-logger';

export const PUT = withApiRoute(async (req, { tx, orgId, userId, params }) => {
  const roleId = params.id;
  const body = await req.json();
  const { name, description, permissions } = body;

  const existingRole = await tx.role.findUnique({
    where: { id: roleId }
  });

  if (!existingRole) {
    throw new ApiError(404, 'Rôle introuvable');
  }
  
  if (existingRole.isSystem) {
    throw new ApiError(403, 'Impossible de modifier un rôle système');
  }

  if (existingRole.organizationId !== orgId) {
    throw new ApiError(403, 'Vous ne pouvez modifier que les rôles de votre organisation');
  }

  if (name) {
    const duplicate = await tx.role.findFirst({
      where: {
        name: name.trim().toUpperCase(),
        id: { not: roleId },
        OR: [
          { organizationId: orgId },
          { isSystem: true, organizationId: null }
        ]
      }
    });

    if (duplicate) {
      throw new ApiError(409, 'Un rôle avec ce nom existe déjà');
    }
  }

  const updatedRole = await tx.role.update({
    where: { id: roleId },
    data: {
      name: name ? name.trim().toUpperCase() : undefined,
      description: description !== undefined ? description : undefined,
      permissions: permissions ? {
        deleteMany: {},
        create: permissions.map((p: any) => ({
          resource: p.resource,
          canRead: p.canRead,
          canWrite: p.canWrite
        }))
      } : undefined
    },
    include: { permissions: true }
  });

  await logAuditEvent({
    organizationId: orgId,
    userId,
    action: 'UPDATE_ROLE',
    resource: 'Role',
    resourceId: updatedRole.id,
    details: { name: updatedRole.name }
  });

  return NextResponse.json(updatedRole);
}, { permission: { resource: 'users', action: 'write' } });

export const DELETE = withApiRoute(async (req, { tx, orgId, userId, params }) => {
  const roleId = params.id;

  const existingRole = await tx.role.findUnique({
    where: { id: roleId }
  });

  if (!existingRole) {
    throw new ApiError(404, 'Rôle introuvable');
  }

  if (existingRole.isSystem) {
    throw new ApiError(403, 'Impossible de supprimer un rôle système');
  }

  if (existingRole.organizationId !== orgId) {
    throw new ApiError(403, 'Vous ne pouvez supprimer que les rôles de votre organisation');
  }

  // Check if role is used
  const usersWithRole = await tx.user.findFirst({
    where: {
      organizationId: orgId,
      roles: {
        has: existingRole.name
      }
    }
  });

  if (usersWithRole) {
    throw new ApiError(409, 'Impossible de supprimer ce rôle car il est assigné à des utilisateurs');
  }

  await tx.role.delete({
    where: { id: roleId }
  });

  await logAuditEvent({
    organizationId: orgId,
    userId,
    action: 'DELETE_ROLE',
    resource: 'Role',
    resourceId: roleId,
    details: { name: existingRole.name }
  });

  return NextResponse.json({ success: true });
}, { permission: { resource: 'users', action: 'write' } });
