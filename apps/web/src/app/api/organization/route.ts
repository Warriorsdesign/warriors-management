import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { PERMISSIONS } from '@/lib/auth/roles';
import { updateOrganizationSchema } from '@/lib/validation/organization';

export const GET = withApiRoute(async (_req, { tx, orgId }) => {
  const organization = await findOrgScopedOrThrow(() => tx.organization.findFirst({ where: { id: orgId } }));
  return NextResponse.json(organization);
}, { permission: { resource: 'organization', action: 'read' } });

export const PATCH = withApiRoute(async (req, { tx, orgId }) => {
  const body = updateOrganizationSchema.parse(await req.json());
  const organization = await findOrgScopedOrThrow(() => tx.organization.findFirst({ where: { id: orgId } }));
  const updated = await tx.organization.update({ where: { id: organization.id }, data: body });
  return NextResponse.json(updated);
}, { permission: { resource: 'organization', action: 'write' } });
