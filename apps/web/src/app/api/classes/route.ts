import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { PERMISSIONS } from '@/lib/auth/roles';
import { createClassSchema } from '@/lib/validation/classes';
import { computeClassStatus, getActiveStudentsForClass } from '@/lib/business/classStatus';
import { parseCenterIds } from '@/lib/api/centerFilter';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { ApiError } from '@/lib/api/errors';

export const GET = withApiRoute(async (req, { tx, orgId, scope, searchParams }) => {
  const formationId = searchParams.get('formationId') ?? undefined;
  const centerIds = scope.effective(parseCenterIds(searchParams));

  const classes = await tx.classGroup.findMany({
    where: {
      organizationId: orgId,
      ...(formationId ? { formationId } : {}),
      ...(centerIds.length ? { centerId: { in: centerIds } } : {}),
    },
    orderBy: { name: 'asc' },
  });

  const data = await Promise.all(
    classes.map(async (c) => {
      const enrolledCount = await getActiveStudentsForClass(tx, c.id);
      return { ...c, enrolledCount, status: computeClassStatus(c.status, c.capacity, enrolledCount) };
    })
  );

  return NextResponse.json({ data });
}, { permission: { resource: 'classes', action: 'read' } });

export const POST = withApiRoute(async (req, { tx, orgId, scope }) => {
  const body = createClassSchema.parse(await req.json());
  scope.assertCenter(body.centerId);
  // Les contrôles de clé étrangère ignorent la RLS : sans ces vérifications, une classe
  // pourrait référencer la formation ou le centre d'une autre organisation.
  await findOrgScopedOrThrow(
    () => tx.formation.findFirst({ where: { id: body.formationId, organizationId: orgId, ...scope.formation() }, select: { id: true } }),
    'Formation introuvable.'
  );
  await findOrgScopedOrThrow(
    () => tx.center.findFirst({ where: { id: body.centerId, organizationId: orgId }, select: { id: true } }),
    'Centre introuvable.'
  );
  // Une classe ne s'ouvre que dans un centre où sa formation est proposée.
  const offered = await tx.formation.count({ where: { id: body.formationId, centers: { some: { id: body.centerId } } } });
  if (!offered) {
    throw new ApiError(400, "Cette formation n'est pas proposée dans ce centre. Ajoutez d'abord le centre à la formation.", 'FORMATION_NOT_IN_CENTER');
  }
  const classGroup = await tx.classGroup.create({
    data: {
      name: body.name,
      formationId: body.formationId,
      centerId: body.centerId,
      capacity: body.capacity,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      status: 'ouverte',
      organizationId: orgId,
    },
  });
  return NextResponse.json({ ...classGroup, enrolledCount: 0, status: 'ouverte' }, { status: 201 });
}, { permission: { resource: 'classes', action: 'write' } });
