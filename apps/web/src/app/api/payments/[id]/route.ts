export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { updatePaymentSchema } from '@/lib/validation/payments';
import { assertPaymentFits, rebuildScheduleForStudent } from '@/lib/business/paymentSchedule';
import { payments, users, students, classGroups } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

type Params = { id: string };

export const GET = withApiRoute<Params>(async (_req, { tx, orgId, scope, params }) => {
  const [paymentRow] = await tx.select({ payment: payments, recordedBy: users }).from(payments).leftJoin(users, eq(users.id, payments.recordedById)).where(and(eq(payments.id, params.id), eq(payments.organizationId, orgId))).limit(1);
  const payment = await findOrgScopedOrThrow(async () => paymentRow ? { ...paymentRow.payment, recordedBy: paymentRow.recordedBy } : null);
  const [studentRow] = await tx.select({ centerId: classGroups.centerId }).from(students).innerJoin(classGroups, eq(classGroups.id, students.classId)).where(and(eq(students.id, payment.studentId), eq(students.organizationId, orgId))).limit(1);
  if (!studentRow) throw new Error("Étudiant introuvable.");
  scope.assertCenter(studentRow.centerId);
  return NextResponse.json(payment);
}, { permission: { resource: 'payments', action: 'read' } });

export const PATCH = withApiRoute<Params>(async (req, { tx, orgId, scope, params }) => {
  const body = updatePaymentSchema.parse(await req.json());
  const [row] = await tx.select().from(payments).where(and(eq(payments.id, params.id), eq(payments.organizationId, orgId))).limit(1);
  const payment = await findOrgScopedOrThrow(async () => row);
  const [studentRow] = await tx.select({ centerId: classGroups.centerId }).from(students).innerJoin(classGroups, eq(classGroups.id, students.classId)).where(and(eq(students.id, payment.studentId), eq(students.organizationId, orgId))).limit(1);
  if (!studentRow) throw new Error("Étudiant introuvable.");
  scope.assertCenter(studentRow.centerId);

  if (body.amount !== undefined) await assertPaymentFits(tx, payment.studentId, orgId, body.amount, payment.id);

  const [updated] = await tx.update(payments).set({
      ...body,
      date: body.date ? new Date(body.date) : undefined,
  }).where(eq(payments.id, payment.id)).returning();

  const schedule = await rebuildScheduleForStudent(tx, payment.studentId, orgId);

  return NextResponse.json({ payment: updated, schedule });
}, { permission: { resource: 'payments', action: 'write' } });

export const DELETE = withApiRoute<Params>(async (_req, { tx, orgId, scope, params }) => {
  const [row] = await tx.select().from(payments).where(and(eq(payments.id, params.id), eq(payments.organizationId, orgId))).limit(1);
  const payment = await findOrgScopedOrThrow(async () => row);
  const [studentRow] = await tx.select({ centerId: classGroups.centerId }).from(students).innerJoin(classGroups, eq(classGroups.id, students.classId)).where(and(eq(students.id, payment.studentId), eq(students.organizationId, orgId))).limit(1);
  if (!studentRow) throw new Error("Étudiant introuvable.");
  scope.assertCenter(studentRow.centerId);

  await tx.delete(payments).where(eq(payments.id, payment.id));
  const schedule = await rebuildScheduleForStudent(tx, payment.studentId, orgId);

  return NextResponse.json({ success: true, schedule });
}, { permission: { resource: 'payments', action: 'write' } });
