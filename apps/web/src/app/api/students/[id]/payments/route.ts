export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { recordPaymentSchema } from '@/lib/validation/students';
import { assertPaymentFits, rebuildScheduleForStudent, withLiveStatus } from '@/lib/business/paymentSchedule';
import { ApiError } from '@/lib/api/errors';
import { students, classGroups, paymentSchedules, payments } from '@/lib/db/schema';
import { and, eq, desc } from 'drizzle-orm';

type Params = { id: string };

export const GET = withApiRoute<Params>(async (_req, { tx, orgId, scope, perms, params }) => {
  perms.assert('students.finance_detail', 'read');
  const [studentRow] = await tx.select().from(students).where(and(eq(students.id, params.id), eq(students.organizationId, orgId))).limit(1);
  const student = await findOrgScopedOrThrow(async () => studentRow);
  const [studentClass] = await tx.select({ centerId: classGroups.centerId }).from(classGroups).where(and(eq(classGroups.id, student.classId), eq(classGroups.organizationId, orgId))).limit(1);
  if (!studentClass) throw new ApiError(404, "Classe introuvable.", "NOT_FOUND");
  scope.assertCenter(studentClass.centerId);
  const [scheduleRows, paymentRows] = await Promise.all([
    tx.select().from(paymentSchedules).where(and(eq(paymentSchedules.studentId, student.id), eq(paymentSchedules.organizationId, orgId))).limit(1),
    tx.select().from(payments).where(and(eq(payments.studentId, student.id), eq(payments.organizationId, orgId))).orderBy(desc(payments.date)),
  ]);
  const schedule = scheduleRows[0];
  return NextResponse.json({ schedule: schedule ? withLiveStatus(schedule) : null, payments: paymentRows });
}, { permission: { resource: 'students', action: 'read' } });

export const POST = withApiRoute<Params>(async (req, { tx, orgId, userId, scope, perms, params }) => {
  if (!perms.can('students.collect', 'write') && !perms.can('payments', 'write')) {
    throw new ApiError(403, 'Permission insuffisante pour encaisser un paiement.', 'FORBIDDEN');
  }
  const body = recordPaymentSchema.parse(await req.json());
  const [studentRow] = await tx.select().from(students).where(and(eq(students.id, params.id), eq(students.organizationId, orgId))).limit(1);
  const student = await findOrgScopedOrThrow(async () => studentRow);
  const [studentClass] = await tx.select({ centerId: classGroups.centerId }).from(classGroups).where(and(eq(classGroups.id, student.classId), eq(classGroups.organizationId, orgId))).limit(1);
  if (!studentClass) throw new ApiError(404, "Classe introuvable.", "NOT_FOUND");
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
}, { permission: { resource: 'students', action: 'read' } });
