export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { ApiError } from '@/lib/api/errors';
import { updateClassSchema } from '@/lib/validation/classes';
import { computeClassStatus, getActiveStudentsForClass } from '@/lib/business/classStatus';

type Params = { id: string };

export const GET = withApiRoute<Params>(async (_req, { tx, orgId, scope, params }) => {
  const classGroup = await findOrgScopedOrThrow(() =>
    tx.classGroup.findFirst({ where: { id: params.id, organizationId: orgId, ...scope.classGroup() } })
  );
  const enrolledCount = await getActiveStudentsForClass(tx, classGroup.id);
  return NextResponse.json({
    ...classGroup,
    enrolledCount,
    status: computeClassStatus(classGroup.status, classGroup.capacity, enrolledCount),
  });
}, { permission: { resource: 'classes', action: 'read' } });

export const PATCH = withApiRoute<Params>(async (req, { tx, orgId, scope, params }) => {
  const body = updateClassSchema.parse(await req.json());
  const classGroup = await findOrgScopedOrThrow(() =>
    tx.classGroup.findFirst({ where: { id: params.id, organizationId: orgId, ...scope.classGroup() } })
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
}, { permission: { resource: 'classes', action: 'write' } });

export const DELETE = withApiRoute<Params>(async (_req, { tx, orgId, scope, params }) => {
  const classGroup = await findOrgScopedOrThrow(() =>
    tx.classGroup.findFirst({ where: { id: params.id, organizationId: orgId, ...scope.classGroup() } })
  );
  // La suppression d'une classe emporterait ses étudiants, leurs paiements et échéanciers (cascade).
  const students = await tx.student.count({ where: { classId: classGroup.id } });
  if (students > 0) {
    throw new ApiError(
      409,
      `Cette classe contient ${students} étudiant(s) : la supprimer effacerait aussi leurs paiements. Clôturez-la plutôt, ou changez d'abord ses étudiants de classe.`,
      'CLASS_HAS_STUDENTS'
    );
  }
  await tx.classGroup.delete({ where: { id: classGroup.id } });
  return NextResponse.json({ success: true });
}, { permission: { resource: 'classes', action: 'write' } });
