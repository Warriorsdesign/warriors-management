export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { ApiError } from '@/lib/api/errors';
import { createPaymentSchema } from '@/lib/validation/payments';
import { assertPaymentFits, rebuildScheduleForStudent } from '@/lib/business/paymentSchedule';
import { parseCenterIds } from '@/lib/api/centerFilter';
import { payments, students, classGroups, users } from '@/lib/db/schema';
import { and, eq, ilike, or, inArray, desc, count } from 'drizzle-orm';

export const GET = withApiRoute(async (_req, { tx, orgId, scope, searchParams }) => {
  const studentId = searchParams.get('studentId') ?? undefined;
  const search = searchParams.get('search')?.trim();
  const centerIds = scope.effective(parseCenterIds(searchParams));
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '10', 10) || 10));

  const filters = [eq(payments.organizationId, orgId)];
  if (studentId) filters.push(eq(payments.studentId, studentId));
  if (search) filters.push(or(ilike(students.firstName, `%${search}%`), ilike(students.lastName, `%${search}%`), ilike(students.matricule, `%${search}%`))!);
  if (centerIds.length) filters.push(inArray(classGroups.centerId, centerIds));
  const where = and(...filters);


  const [totalRow] = await tx.select({ value: count() }).from(payments).innerJoin(students, eq(students.id, payments.studentId)).leftJoin(classGroups, eq(classGroups.id, students.classId)).where(where);
  const rows = await tx.select({ payment: payments, student: { firstName: students.firstName, lastName: students.lastName, matricule: students.matricule }, recordedBy: { firstName: users.firstName, lastName: users.lastName } })
    .from(payments).innerJoin(students, eq(students.id, payments.studentId)).leftJoin(classGroups, eq(classGroups.id, students.classId)).leftJoin(users, eq(users.id, payments.recordedById))
    .where(where).orderBy(desc(payments.date)).limit(pageSize).offset((page - 1) * pageSize);
  const total = Number(totalRow?.value ?? 0);
  const paymentRows = rows.map((row) => ({ ...row.payment, student: row.student, recordedBy: row.recordedBy }));

  return NextResponse.json({ data: paymentRows, meta: { total, page, pageSize } });
}, { permission: { resource: 'payments', action: 'read' } });

export const POST = withApiRoute(async (req, { tx, orgId, userId, scope }) => {
  const body = createPaymentSchema.parse(await req.json());

  const [studentRow] = await tx.select().from(students).where(and(eq(students.id, body.studentId), eq(students.organizationId, orgId))).limit(1);
  const student = await findOrgScopedOrThrow(async () => studentRow, 'Student not found');

  if (!student) throw new ApiError(400, 'Étudiant introuvable.', 'STUDENT_NOT_FOUND');
  const [studentClass] = await tx.select({ centerId: classGroups.centerId }).from(classGroups).where(and(eq(classGroups.id, student.classId), eq(classGroups.organizationId, orgId))).limit(1);
  if (!studentClass) throw new ApiError(400, "Classe introuvable.", "CLASS_NOT_FOUND");
  scope.assertCenter(studentClass.centerId);

  await assertPaymentFits(tx, student.id, orgId, body.amount);

  const [payment] = await tx.insert(payments).values({
      studentId: student.id,
      organizationId: orgId,
      amount: body.amount,
      date: body.date ? new Date(body.date) : new Date(),
      method: body.method,
      motif: body.motif,
      reference: body.reference,
      recordedById: userId,
  }).returning();

  const schedule = await rebuildScheduleForStudent(tx, student.id, orgId);

  return NextResponse.json({ payment, schedule }, { status: 201 });
}, { permission: { resource: 'payments', action: 'write' } });
