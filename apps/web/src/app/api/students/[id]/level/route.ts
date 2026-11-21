import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { ApiError } from '@/lib/api/errors';
import { changeLevelSchema } from '@/lib/validation/students';
import type { Level } from '@/lib/business/formations';
import { students, classGroups, formations } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

type Params = { id: string };
type ProgressionLog = { id: string; date: string; status: string; level?: string | null; recordedBy: string; reason?: string };

export const PATCH = withApiRoute<Params>(async (req, { tx, orgId, userId, scope, params }) => {
  const body = changeLevelSchema.parse(await req.json());
  const [studentRow] = await tx.select({ student: students, classGroup: classGroups, formation: formations }).from(students).innerJoin(classGroups, eq(classGroups.id, students.classId)).innerJoin(formations, eq(formations.id, classGroups.formationId)).where(and(eq(students.id, params.id), eq(students.organizationId, orgId))).limit(1);
  const student = await findOrgScopedOrThrow(async () => studentRow ? { ...studentRow.student, classGroup: { ...studentRow.classGroup, formation: studentRow.formation } } : null);
  scope.assertCenter(student.classGroup.centerId);

  const levels = (student.classGroup.formation.levels as Level[] | null) ?? [];
  if (!student.classGroup.formation.hasLevels || !levels.some((l) => l.id === body.levelId)) {
    throw new ApiError(400, 'Niveau invalide pour cette formation.', 'INVALID_LEVEL');
  }

  const existingLogs = (student.progressionLogs as ProgressionLog[] | null) ?? [];
  const newLog: ProgressionLog = {
    id: randomUUID(),
    date: new Date().toISOString(),
    status: 'en_cours',
    level: body.levelId,
    recordedBy: userId,
    reason: 'Passage au niveau suivant',
  };

  const [updated] = await tx.update(students).set({
      currentLevel: body.levelId,
      currentStatus: 'en_cours',
      progressionLogs: [newLog, ...existingLogs],
  }).where(eq(students.id, student.id)).returning();
  return NextResponse.json(updated);
}, { permission: { resource: 'students', action: 'write' } });
