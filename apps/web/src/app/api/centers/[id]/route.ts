export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { ApiError } from '@/lib/api/errors';
import { assertCenterNameAvailable } from '@/lib/business/centers';
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
  if (body.name !== undefined) await assertCenterNameAvailable(tx, orgId, body.name, center.id);
  const updated = await tx.center.update({ where: { id: center.id }, data: body });
  return NextResponse.json(updated);
}, { allowedRoles: [ROLES.ADMIN], permission: { resource: 'centers', action: 'write' } });

export const DELETE = withApiRoute<Params>(async (_req, { tx, orgId, params }) => {
  const center = await findOrgScopedOrThrow(() =>
    tx.center.findFirst({ where: { id: params.id, organizationId: orgId } })
  );
  // La suppression d'un centre emporterait ses classes (donc leurs étudiants et paiements) et ses dépenses.
  const [classes, expenses] = await Promise.all([
    tx.classGroup.count({ where: { centerId: center.id } }),
    tx.expense.count({ where: { centerId: center.id } }),
  ]);
  if (classes > 0 || expenses > 0) {
    const what = [classes > 0 ? `${classes} classe(s)` : '', expenses > 0 ? `${expenses} dépense(s)` : ''].filter(Boolean).join(' et ');
    throw new ApiError(409, `Ce centre a encore ${what} : le supprimer effacerait ces données. Passez-le plutôt en inactif.`, 'CENTER_HAS_DATA');
  }
  await tx.center.delete({ where: { id: center.id } });
  return NextResponse.json({ success: true });
}, { allowedRoles: [ROLES.ADMIN], permission: { resource: 'centers', action: 'write' } });
