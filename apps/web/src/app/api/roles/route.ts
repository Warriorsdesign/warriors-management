import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { ApiError } from '@/lib/api/errors';
import { logAuditEvent } from '@/lib/audit/audit-logger';

export const GET = withApiRoute(async (req, { tx, orgId }) => {
  const roles = await tx.role.findMany({
    where: {
      OR: [
        { organizationId: orgId },
        { isSystem: true, organizationId: null }
      ]
    },
    include: {
      permissions: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(roles);
}, { permission: { resource: 'users', action: 'read' } });

export const POST = withApiRoute(async (req, { tx, orgId, userId }) => {
  const body = await req.json();
  const { name, description, permissions } = body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new ApiError(400, 'Le nom du rôle est requis');
  }

  // Check if role name already exists in org
  const existingRole = await tx.role.findFirst({
    where: {
      name: name.trim(),
      OR: [
        { organizationId: orgId },
        { isSystem: true, organizationId: null }
      ]
    }
  });

  if (existingRole) {
    throw new ApiError(409, 'Un rôle avec ce nom existe déjà');
  }

  const newRole = await tx.role.create({
    data: {
      name: name.trim().toUpperCase(),
      description,
      isSystem: false,
      organizationId: orgId,
      permissions: {
        create: permissions.map((p: any) => ({
          resource: p.resource,
          canRead: p.canRead,
          canWrite: p.canWrite
        }))
      }
    },
    include: { permissions: true }
  });

  await logAuditEvent({
    organizationId: orgId,
    userId,
    action: 'CREATE_ROLE',
    resource: 'Role',
    resourceId: newRole.id,
    details: { name: newRole.name }
  });

  return NextResponse.json(newRole, { status: 201 });
}, { permission: { resource: 'users', action: 'write' } });
