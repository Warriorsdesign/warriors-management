export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { ApiError } from '@/lib/api/errors';
import { classGroups, students } from '@/lib/db/schema';
import { and, eq, count } from 'drizzle-orm';
import { updateClassSchema } from '@/lib/validation/classes';
import { computeClassStatus, getActiveStudentsForClass } from '@/lib/business/classStatus';

type Params = { id: string };

export const GET = withApiRoute<Params>(async (_req, { tx, orgId, scope, params }) => {
  const [row] = await tx.select().from(classGroups).where(and(eq(classGroups.id, params.id), eq(classGroups.organizationId, orgId))).limit(1);
  const classGroup = await findOrgScopedOrThrow(async () => row);
  scope.assertCenter(classGroup.centerId);
  const enrolledCount = await getActiveStudentsForClass(tx, classGroup.id);
  return NextResponse.json({
    ...classGroup,
    enrolledCount,
    status: computeClassStatus(classGroup.status, classGroup.capacity, enrolledCount),
  });
}, { permission: { resource: 'classes', action: 'read' } });

export const PATCH = withApiRoute<Params>(async (req, { tx, orgId, scope, params }) => {
  const body = updateClassSchema.parse(await req.json());
  const [row] = await tx.select().from(classGroups).where(and(eq(classGroups.id, params.id), eq(classGroups.organizationId, orgId))).limit(1);
  const classGroup = await findOrgScopedOrThrow(async () => row);
  scope.assertCenter(classGroup.centerId);
  const [updated] = await tx.update(classGroups).set({
      ...body,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
  }).where(eq(classGroups.id, classGroup.id)).returning();
  const enrolledCount = await getActiveStudentsForClass(tx, updated.id);
  return NextResponse.json({
    ...updated,
    enrolledCount,
    status: computeClassStatus(updated.status, updated.capacity, enrolledCount),
  });
}, { permission: { resource: 'classes', action: 'write' } });

export const DELETE = withApiRoute<Params>(async (_req, { tx, orgId, scope, params }) => {
  const [row] = await tx.select().from(classGroups).where(and(eq(classGroups.id, params.id), eq(classGroups.organizationId, orgId))).limit(1);
  const classGroup = await findOrgScopedOrThrow(async () => row);
  scope.assertCenter(classGroup.centerId);
  // La suppression d'une classe emporterait ses étudiants, leurs paiements et échéanciers (cascade).
  const [studentRow] = await tx.select({ value: count() }).from(students).where(eq(students.classId, classGroup.id));
  const studentsCount = Number(studentRow?.value ?? 0);
  if (studentsCount > 0) {
    throw new ApiError(
      409,
      `Cette classe contient ${studentsCount} étudiant(s) : la supprimer effacerait aussi leurs paiements. Clôturez-la plutôt, ou changez d'abord ses étudiants de classe.`,
      'CLASS_HAS_STUDENTS'
    );
  }
  await tx.delete(classGroups).where(eq(classGroups.id, classGroup.id));
  return NextResponse.json({ success: true });
}, { permission: { resource: 'classes', action: 'write' } });
