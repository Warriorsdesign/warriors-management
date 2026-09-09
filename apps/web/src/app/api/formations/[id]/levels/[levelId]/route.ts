import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { PERMISSIONS } from '@/lib/auth/roles';
import { updateLevelSchema } from '@/lib/validation/formations';
import type { Level } from '@/lib/business/formations';

type Params = { id: string; levelId: string };

export const PATCH = withApiRoute<Params>(async (req, { tx, orgId, params }) => {
  const body = updateLevelSchema.parse(await req.json());
  const formation = await findOrgScopedOrThrow(() =>
    tx.formation.findFirst({ where: { id: params.id, organizationId: orgId } })
  );

  const levels = (formation.levels as Level[] | null) ?? [];
  const levelExists = levels.some((l) => l.id === params.levelId);
  if (!levelExists) {
    return NextResponse.json({ error: 'Level not found', code: 'NOT_FOUND' }, { status: 404 });
  }
  const updatedLevels = levels.map((l) => (l.id === params.levelId ? { ...l, name: body.name } : l));

  const updated = await tx.formation.update({
    where: { id: formation.id },
    data: { levels: updatedLevels as unknown as Prisma.InputJsonValue },
  });
  return NextResponse.json(updated);
}, { allowedRoles: PERMISSIONS.formations.write });
