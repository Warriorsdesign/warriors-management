import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { ROLES } from '@/lib/auth/roles';
import { updateCenterSchema } from '@/lib/validation/centers';

type Params = { id: string };

export const GET = withApiRoute<Params>(async (_req, { tx, orgId, scope, params }) => {
  const center = await findOrgScopedOrThrow(() =>
    tx.center.findFirst({ where: { id: params.id, organizationId: orgId, ...scope.center() } })
  );
  return NextResponse.json(center);
}, { permission: { resource: 'centers', action: 'read' } });

// Les centres structurent le périmètre d'accès des utilisateurs : seuls les administrateurs
// de l'organisation peuvent les créer, les modifier ou les supprimer.
export const PATCH = withApiRoute<Params>(async (req, { tx, orgId, params }) => {
  const body = updateCenterSchema.parse(await req.json());
  const center = await findOrgScopedOrThrow(() =>
    tx.center.findFirst({ where: { id: params.id, organizationId: orgId } })
  );
  const updated = await tx.center.update({ where: { id: center.id }, data: body });
  return NextResponse.json(updated);
}, { allowedRoles: [ROLES.ADMIN], permission: { resource: 'centers', action: 'write' } });

export const DELETE = withApiRoute<Params>(async (_req, { tx, orgId, params }) => {
  const center = await findOrgScopedOrThrow(() =>
    tx.center.findFirst({ where: { id: params.id, organizationId: orgId } })
  );
  await tx.center.delete({ where: { id: center.id } });
  return NextResponse.json({ success: true });
}, { allowedRoles: [ROLES.ADMIN], permission: { resource: 'centers', action: 'write' } });
