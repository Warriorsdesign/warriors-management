export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { createClassSchema } from '@/lib/validation/classes';
import { computeClassStatus, getActiveStudentsForClass } from '@/lib/business/classStatus';
import { parseCenterIds } from '@/lib/api/centerFilter';
import { ApiError } from '@/lib/api/errors';
import { classGroups, formations, formationCenters, centers } from '@/lib/db/schema';
import { and, eq, asc, inArray, count } from 'drizzle-orm';

export const GET = withApiRoute(async (req, { tx, orgId, scope, searchParams }) => {
  const formationId = searchParams.get('formationId') ?? undefined;
  const centerIds = scope.effective(parseCenterIds(searchParams));

  const filters = [eq(classGroups.organizationId, orgId)];
  if (formationId) filters.push(eq(classGroups.formationId, formationId));
  if (centerIds.length) filters.push(inArray(classGroups.centerId, centerIds));
  const classes = await tx.select().from(classGroups).where(and(...filters)).orderBy(asc(classGroups.name));

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
  const [formation] = await tx.select({ id: formations.id }).from(formations).where(and(eq(formations.id, body.formationId), eq(formations.organizationId, orgId))).limit(1);
  if (!formation) throw new ApiError(404, 'Formation introuvable.', 'NOT_FOUND');
  const [center] = await tx.select({ id: centers.id }).from(centers).where(and(eq(centers.id, body.centerId), eq(centers.organizationId, orgId))).limit(1);
  if (!center) throw new ApiError(404, 'Centre introuvable.', 'NOT_FOUND');
  // Une classe ne s'ouvre que dans un centre où sa formation est proposée.
  const [offeredRow] = await tx.select({ value: count() }).from(formationCenters).where(and(eq(formationCenters.formationId, body.formationId), eq(formationCenters.centerId, body.centerId)));
  const offered = Number(offeredRow?.value ?? 0);
  if (!offered) {
    throw new ApiError(400, "Cette formation n'est pas proposée dans ce centre. Ajoutez d'abord le centre à la formation.", 'FORMATION_NOT_IN_CENTER');
  }
  const [classGroup] = await tx.insert(classGroups).values({
      name: body.name,
      formationId: body.formationId,
      centerId: body.centerId,
      capacity: body.capacity,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      status: 'ouverte',
      organizationId: orgId,
  }).returning();
  return NextResponse.json({ ...classGroup, enrolledCount: 0, status: 'ouverte' }, { status: 201 });
}, { permission: { resource: 'classes', action: 'write' } });
