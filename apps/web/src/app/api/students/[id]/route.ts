export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { updateStudentSchema } from '@/lib/validation/students';
import { redactStudentFinance } from '@/lib/business/studentFinance';
import { assertCanMoveToClass } from '@/lib/business/studentClass';
import { withLiveStatus } from '@/lib/business/paymentSchedule';
import { students, classGroups, formations, centers, paymentSchedules, payments } from '@/lib/db/schema';
import { and, eq, desc } from 'drizzle-orm';
import { ApiError } from '@/lib/api/errors';

type Params = { id: string };

export const GET = withApiRoute<Params>(async (_req, { tx, orgId, scope, perms, params }) => {
  const [row] = await tx.select({ student: students, classGroup: classGroups, formation: formations, center: centers }).from(students)
    .innerJoin(classGroups, eq(classGroups.id, students.classId)).innerJoin(formations, eq(formations.id, classGroups.formationId)).innerJoin(centers, eq(centers.id, classGroups.centerId))
    .where(and(eq(students.id, params.id), eq(students.organizationId, orgId))).limit(1);
  const studentRow = await findOrgScopedOrThrow(async () => row);
  scope.assertCenter(studentRow.center.id);
  const scheduleRows = await tx.select().from(paymentSchedules).where(eq(paymentSchedules.studentId, studentRow.student.id)).limit(1);
  const paymentRows = perms.studentFinance === 'full' ? await tx.select().from(payments).where(eq(payments.studentId, studentRow.student.id)).orderBy(desc(payments.date)) : [];
  const schedule = scheduleRows[0] ? withLiveStatus(scheduleRows[0]) : null;
  const student = { ...studentRow.student, classGroup: { ...studentRow.classGroup, formation: studentRow.formation, center: studentRow.center } };
  return NextResponse.json({ ...student, ...redactStudentFinance(schedule, paymentRows, perms.studentFinance) });
}, { permission: { resource: 'students', action: 'read' } });

export const PATCH = withApiRoute<Params>(async (req, { tx, orgId, scope, params }) => {
  const body = updateStudentSchema.parse(await req.json());
  const [row] = await tx.select().from(students).where(and(eq(students.id, params.id), eq(students.organizationId, orgId))).limit(1);
  const student = await findOrgScopedOrThrow(async () => row);
  const [studentClass] = await tx.select({ centerId: classGroups.centerId }).from(classGroups).where(and(eq(classGroups.id, student.classId), eq(classGroups.organizationId, orgId))).limit(1);
  if (!studentClass) throw new ApiError(404, "Classe introuvable.", "NOT_FOUND");
  scope.assertCenter(studentClass.centerId);
  if (body.classId && body.classId !== student.classId) {
    const [targetRow] = await tx.select().from(classGroups).where(and(eq(classGroups.id, body.classId), eq(classGroups.organizationId, orgId))).limit(1);
    const target = await findOrgScopedOrThrow(async () => targetRow, 'Classe introuvable.');
    scope.assertCenter(target.centerId);
    await assertCanMoveToClass(tx, student, target);
  }
  const { email, enrollmentDate, ...rest } = body;
  const [updated] = await tx.update(students).set({ ...rest, ...(email !== undefined ? { email: email || null } : {}), ...(enrollmentDate !== undefined ? { enrollmentDate: new Date(enrollmentDate) } : {}) }).where(eq(students.id, student.id)).returning();
  return NextResponse.json(updated);
}, { permission: { resource: 'students', action: 'write' } });

export const DELETE = withApiRoute<Params>(async (_req, { tx, orgId, scope, params }) => {
  const [row] = await tx.select().from(students).where(and(eq(students.id, params.id), eq(students.organizationId, orgId))).limit(1);
  const student = await findOrgScopedOrThrow(async () => row);
  const [studentClass] = await tx.select({ centerId: classGroups.centerId }).from(classGroups).where(and(eq(classGroups.id, student.classId), eq(classGroups.organizationId, orgId))).limit(1);
  if (!studentClass) throw new ApiError(404, "Classe introuvable.", "NOT_FOUND");
  scope.assertCenter(studentClass.centerId);
  await tx.delete(students).where(eq(students.id, student.id));
  return NextResponse.json({ success: true });
}, { permission: { resource: 'students', action: 'write' } });
