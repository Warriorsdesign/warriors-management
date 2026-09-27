import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { withApiRoute } from '@/lib/api/handler';
import { createFormationSchema } from '@/lib/validation/formations';
import { formationInclude, regenerateLevels, toFormationDTO } from '@/lib/business/formations';
import { assertOrgCenters } from '@/lib/db/scoped';
import { parseCenterIds, formationCentersWhere } from '@/lib/api/centerFilter';

export const GET = withApiRoute(async (req, { tx, orgId, scope, searchParams }) => {
  const search = searchParams.get('search')?.trim();
  const centerIds = scope.effective(parseCenterIds(searchParams));
  const formations = await tx.formation.findMany({
    where: {
      organizationId: orgId,
      ...scope.formation(),
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      ...formationCentersWhere(centerIds),
    },
    orderBy: { name: 'asc' },
    include: formationInclude(scope),
  });
  return NextResponse.json({ data: formations.map(toFormationDTO) });
}, { permission: { resource: 'formations', action: 'read' } });

export const POST = withApiRoute(async (req, { tx, orgId, scope }) => {
  const { centerIds, ...body } = createFormationSchema.parse(await req.json());
  // Centres obligatoires, de l'organisation, et (pour un utilisateur restreint) de son périmètre.
  await assertOrgCenters(tx, orgId, centerIds);
  scope.assertAssignableCenters(centerIds);

  const levels = body.hasLevels ? regenerateLevels(null, body.levelCount!) : [];
  const formation = await tx.formation.create({
    data: {
      ...body,
      levels: levels as unknown as Prisma.InputJsonValue,
      organizationId: orgId,
      centers: { connect: centerIds.map((id) => ({ id })) },
    },
    include: formationInclude(scope),
  });
  return NextResponse.json(toFormationDTO(formation), { status: 201 });
}, { permission: { resource: 'formations', action: 'write' } });
