import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { updateFormationSchema } from '@/lib/validation/formations';
import {
  regenerateLevels, assertFormationDeletable, assertFormationEditable, assertCentersKeepClasses,
  formationInclude, toFormationDTO, type Level,
} from '@/lib/business/formations';
import { assertOrgCenters } from '@/lib/db/scoped';

type Params = { id: string };

export const GET = withApiRoute<Params>(async (_req, { tx, orgId, scope, params }) => {
  const formation = await findOrgScopedOrThrow(() =>
    tx.formation.findFirst({ where: { id: params.id, organizationId: orgId, ...scope.formation() }, include: formationInclude(scope) })
  );
  return NextResponse.json(toFormationDTO(formation));
}, { permission: { resource: 'formations', action: 'read' } });

export const PATCH = withApiRoute<Params>(async (req, { tx, orgId, scope, params }) => {
  const { centerIds, ...body } = updateFormationSchema.parse(await req.json());
  const formation = await findOrgScopedOrThrow(() =>
    tx.formation.findFirst({ where: { id: params.id, organizationId: orgId, ...scope.formation() } })
  );
  await assertFormationEditable(tx, formation.id, scope);
  if (centerIds) {
    await assertOrgCenters(tx, orgId, centerIds);
    scope.assertAssignableCenters(centerIds);
    await assertCentersKeepClasses(tx, formation.id, centerIds);
  }

  const hasLevels = body.hasLevels ?? formation.hasLevels;
  const levelCount = body.levelCount ?? formation.levelCount ?? undefined;
  const levels = hasLevels && levelCount
    ? regenerateLevels(formation.levels as Level[] | null, levelCount)
    : formation.levels;

  const updated = await tx.formation.update({
    where: { id: formation.id },
    data: {
      ...body,
      levels: levels as Prisma.InputJsonValue,
      ...(centerIds ? { centers: { set: centerIds.map((id) => ({ id })) } } : {}),
    },
    include: formationInclude(scope),
  });
  return NextResponse.json(toFormationDTO(updated));
}, { permission: { resource: 'formations', action: 'write' } });

export const DELETE = withApiRoute<Params>(async (_req, { tx, orgId, scope, params }) => {
  const formation = await findOrgScopedOrThrow(() =>
    tx.formation.findFirst({ where: { id: params.id, organizationId: orgId, ...scope.formation() } })
  );
  await assertFormationEditable(tx, formation.id, scope);
  await assertFormationDeletable(tx, formation.id);
  await tx.formation.delete({ where: { id: formation.id } });
  return NextResponse.json({ success: true });
}, { permission: { resource: 'formations', action: 'write' } });
