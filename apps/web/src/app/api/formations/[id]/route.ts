import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { PERMISSIONS } from '@/lib/auth/roles';
import { updateFormationSchema } from '@/lib/validation/formations';
import { regenerateLevels, assertFormationDeletable, type Level } from '@/lib/business/formations';

type Params = { id: string };

export const GET = withApiRoute<Params>(async (_req, { tx, orgId, params }) => {
  const formation = await findOrgScopedOrThrow(() =>
    tx.formation.findFirst({ where: { id: params.id, organizationId: orgId } })
  );
  return NextResponse.json(formation);
}, { allowedRoles: PERMISSIONS.formations.read });

export const PATCH = withApiRoute<Params>(async (req, { tx, orgId, params }) => {
  const body = updateFormationSchema.parse(await req.json());
  const formation = await findOrgScopedOrThrow(() =>
    tx.formation.findFirst({ where: { id: params.id, organizationId: orgId } })
  );

  const hasLevels = body.hasLevels ?? formation.hasLevels;
  const levelCount = body.levelCount ?? formation.levelCount ?? undefined;
  const levels = hasLevels && levelCount
    ? regenerateLevels(formation.levels as Level[] | null, levelCount)
    : formation.levels;

  const updated = await tx.formation.update({
    where: { id: formation.id },
    data: { ...body, levels: levels as Prisma.InputJsonValue },
  });
  return NextResponse.json(updated);
}, { allowedRoles: PERMISSIONS.formations.write });

export const DELETE = withApiRoute<Params>(async (_req, { tx, orgId, params }) => {
  const formation = await findOrgScopedOrThrow(() =>
    tx.formation.findFirst({ where: { id: params.id, organizationId: orgId } })
  );
  await assertFormationDeletable(tx, formation.id);
  await tx.formation.delete({ where: { id: formation.id } });
  return NextResponse.json({ success: true });
}, { allowedRoles: PERMISSIONS.formations.write });
