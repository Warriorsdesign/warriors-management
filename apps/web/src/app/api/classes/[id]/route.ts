import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { PERMISSIONS } from '@/lib/auth/roles';
import { updateClassSchema } from '@/lib/validation/classes';
import { computeClassStatus, getActiveStudentsForClass } from '@/lib/business/classStatus';

type Params = { id: string };

export const GET = withApiRoute<Params>(async (_req, { tx, orgId, params }) => {
  const classGroup = await findOrgScopedOrThrow(() =>
    tx.classGroup.findFirst({ where: { id: params.id, organizationId: orgId } })
  );
  const enrolledCount = await getActiveStudentsForClass(tx, classGroup.id);
  return NextResponse.json({
    ...classGroup,
    enrolledCount,
    status: computeClassStatus(classGroup.status, classGroup.capacity, enrolledCount),
  });
}, { allowedRoles: PERMISSIONS.classes.read });

export const PATCH = withApiRoute<Params>(async (req, { tx, orgId, params }) => {
  const body = updateClassSchema.parse(await req.json());
  const classGroup = await findOrgScopedOrThrow(() =>
    tx.classGroup.findFirst({ where: { id: params.id, organizationId: orgId } })
  );
  const updated = await tx.classGroup.update({
    where: { id: classGroup.id },
    data: {
      ...body,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    },
  });
  const enrolledCount = await getActiveStudentsForClass(tx, updated.id);
  return NextResponse.json({
    ...updated,
    enrolledCount,
    status: computeClassStatus(updated.status, updated.capacity, enrolledCount),
  });
}, { allowedRoles: PERMISSIONS.classes.write });

export const DELETE = withApiRoute<Params>(async (_req, { tx, orgId, params }) => {
  const classGroup = await findOrgScopedOrThrow(() =>
    tx.classGroup.findFirst({ where: { id: params.id, organizationId: orgId } })
  );
  await tx.classGroup.delete({ where: { id: classGroup.id } });
  return NextResponse.json({ success: true });
}, { allowedRoles: PERMISSIONS.classes.write });
