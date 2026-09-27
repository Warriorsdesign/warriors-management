import { NextResponse } from 'next/server';
import { withAdminRoute } from '@/lib/api/admin-handler';
import { logAuditEvent } from '@/lib/audit/audit-logger';

export const GET = withAdminRoute(async (_req, { prisma, params }) => {
  const { id } = params;

  const organization = await prisma.organization.findUnique({
    where: { id },
    include: {
      subscription: true,
      centers: {
        select: {
          id: true,
          name: true,
          status: true,
          address: true,
          createdAt: true,
          _count: {
            select: { classes: true, expenses: true },
          },
        },
      },
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          matricule: true,
          roles: true,
          status: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          students: true,
          formations: true,
          classes: true,
          payments: true,
          expenses: true,
        },
      },
    },
  });

  if (!organization) {
    return NextResponse.json(
      { error: 'Organisation non trouvée.' },
      { status: 404 }
    );
  }

  return NextResponse.json({ organization });
});

export const PATCH = withAdminRoute(async (req, { prisma, adminUser, params }) => {
  const { id } = params;
  const body = await req.json();
  const { name, email, phone, address } = body;

  const existing = await prisma.organization.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: 'Organisation non trouvée.' },
      { status: 404 }
    );
  }

  const updated = await prisma.organization.update({
    where: { id },
    data: {
      name: name !== undefined ? name.trim() : existing.name,
      email: email !== undefined ? email?.trim() || null : existing.email,
      phone: phone !== undefined ? phone?.trim() || null : existing.phone,
      address: address !== undefined ? address?.trim() || null : existing.address,
    },
  });

  await logAuditEvent({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    actorName: 'Super Admin',
    action: 'ORGANIZATION_UPDATED',
    resource: 'Organization',
    resourceId: id,
    details: {
      previous: { name: existing.name, email: existing.email },
      updated: { name: updated.name, email: updated.email },
    },
  });

  return NextResponse.json({ success: true, organization: updated });
});
