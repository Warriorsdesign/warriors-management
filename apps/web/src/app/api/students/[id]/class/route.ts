import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { ApiError } from '@/lib/api/errors';
import { changeClassSchema } from '@/lib/validation/students';
import { assertCanMoveToClass } from '@/lib/business/studentClass';
import { students, classGroups } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

type Params = { id: string };

export const PATCH = withApiRoute<Params>(async (req, { tx, orgId, scope, params }) => {
  const body = changeClassSchema.parse(await req.json());
  const [studentRow] = await tx.select().from(students).where(and(eq(students.id, params.id), eq(students.organizationId, orgId))).limit(1);
  const student = await findOrgScopedOrThrow(async () => studentRow);
  const [studentClass] = await tx.select({ centerId: classGroups.centerId }).from(classGroups).where(and(eq(classGroups.id, student.classId), eq(classGroups.organizationId, orgId))).limit(1);
  if (studentClass) scope.assertCenter(studentClass.centerId);
  const [classGroup] = await tx.select().from(classGroups).where(and(eq(classGroups.id, body.classId), eq(classGroups.organizationId, orgId))).limit(1);
  if (!classGroup) throw new ApiError(400, 'Classe introuvable.', 'CLASS_NOT_FOUND');
  scope.assertCenter(classGroup.centerId);
  if (classGroup.id !== student.classId) await assertCanMoveToClass(tx, student, classGroup);

  const [updated] = await tx.update(students).set({ classId: body.classId }).where(eq(students.id, student.id)).returning();
  return NextResponse.json(updated);
}, { permission: { resource: 'students', action: 'write' } });
