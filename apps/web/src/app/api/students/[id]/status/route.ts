import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { changeStatusSchema } from '@/lib/validation/students';
import { assertClassHasRoom, isActiveStatus } from '@/lib/business/classStatus';
import { assertStudentQuota } from '@/lib/business/studentQuota';
import { students, classGroups } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { ApiError } from '@/lib/api/errors';

type Params = { id: string };
type ProgressionLog = { id: string; date: string; status: string; level?: string | null; recordedBy: string; reason?: string };

export const PATCH = withApiRoute<Params>(async (req, { tx, orgId, userId, scope, params }) => {
  const body = changeStatusSchema.parse(await req.json());
  const [studentRow] = await tx.select().from(students).where(and(eq(students.id, params.id), eq(students.organizationId, orgId))).limit(1);
  const student = await findOrgScopedOrThrow(async () => studentRow);
  const [studentClass] = await tx.select({ centerId: classGroups.centerId }).from(classGroups).where(and(eq(classGroups.id, student.classId), eq(classGroups.organizationId, orgId))).limit(1);
  if (!studentClass) throw new ApiError(404, "Classe introuvable.", "NOT_FOUND");
  scope.assertCenter(studentClass.centerId);

  if (!isActiveStatus(student.currentStatus) && isActiveStatus(body.status)) {
    const [classGroup] = await tx.select().from(classGroups).where(and(eq(classGroups.id, student.classId), eq(classGroups.organizationId, orgId))).limit(1);
    if (!classGroup) throw new ApiError(404, 'Classe introuvable.', 'NOT_FOUND');
    await assertClassHasRoom(tx, classGroup, student.id);
    await assertStudentQuota(tx, orgId);
  }

  const existingLogs = (student.progressionLogs as ProgressionLog[] | null) ?? [];
  const newLog: ProgressionLog = {
    id: randomUUID(),
    date: new Date().toISOString(),
    status: body.status,
    level: student.currentLevel,
    recordedBy: userId,
    reason: body.motif,
  };

  const [updated] = await tx.update(students).set({
      currentStatus: body.status,
      progressionLogs: [newLog, ...existingLogs],
  }).where(eq(students.id, student.id)).returning();
  return NextResponse.json(updated);
}, { permission: { resource: 'students', action: 'write' } });
