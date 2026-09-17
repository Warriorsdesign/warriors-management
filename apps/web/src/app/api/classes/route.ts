import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { PERMISSIONS } from '@/lib/auth/roles';
import { createClassSchema } from '@/lib/validation/classes';
import { computeClassStatus, getActiveStudentsForClass } from '@/lib/business/classStatus';
import { parseCenterIds } from '@/lib/api/centerFilter';

export const GET = withApiRoute(async (req, { tx, orgId, searchParams }) => {
  const formationId = searchParams.get('formationId') ?? undefined;
  const centerIds = parseCenterIds(searchParams);

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
}, { allowedRoles: PERMISSIONS.classes.read });

export const POST = withApiRoute(async (req, { tx, orgId }) => {
  const body = createClassSchema.parse(await req.json());
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
}, { allowedRoles: PERMISSIONS.classes.write });
