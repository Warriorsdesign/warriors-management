import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { PERMISSIONS } from '@/lib/auth/roles';
import { recordPaymentSchema } from '@/lib/validation/students';
import { rebuildScheduleForStudent } from '@/lib/business/paymentSchedule';

type Params = { id: string };

export const GET = withApiRoute<Params>(async (_req, { tx, orgId, params }) => {
  const student = await findOrgScopedOrThrow(() =>
    tx.student.findFirst({ where: { id: params.id, organizationId: orgId } })
  );
  const [schedule, payments] = await Promise.all([
    tx.paymentSchedule.findFirst({ where: { studentId: student.id, organizationId: orgId } }),
    tx.payment.findMany({ where: { studentId: student.id, organizationId: orgId }, orderBy: { date: 'desc' } }),
  ]);
  return NextResponse.json({ schedule, payments });
}, { allowedRoles: PERMISSIONS.students.read });

export const POST = withApiRoute<Params>(async (req, { tx, orgId, userId, params }) => {
  const body = recordPaymentSchema.parse(await req.json());
  const student = await findOrgScopedOrThrow(() =>
    tx.student.findFirst({ where: { id: params.id, organizationId: orgId } })
  );

  const payment = await tx.payment.create({
    data: {
      studentId: student.id,
      organizationId: orgId,
      amount: body.amount,
      date: body.date ? new Date(body.date) : new Date(),
      method: body.method,
      motif: body.motif,
      reference: body.reference,
      recordedById: userId,
    },
  });

  const schedule = await rebuildScheduleForStudent(tx, student.id, orgId);

  return NextResponse.json({ payment, schedule }, { status: 201 });
}, { allowedRoles: PERMISSIONS.payments.write });
