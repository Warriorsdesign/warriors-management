import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { recordPaymentSchema } from '@/lib/validation/students';
import { rebuildScheduleForStudent } from '@/lib/business/paymentSchedule';
import { ApiError } from '@/lib/api/errors';

type Params = { id: string };

export const GET = withApiRoute<Params>(async (_req, { tx, orgId, scope, perms, params }) => {
  perms.assert('students.finance_detail', 'read');
  const student = await findOrgScopedOrThrow(() =>
    tx.student.findFirst({ where: { id: params.id, organizationId: orgId, ...scope.student() } })
  );
  const [schedule, payments] = await Promise.all([
    tx.paymentSchedule.findFirst({ where: { studentId: student.id, organizationId: orgId } }),
    tx.payment.findMany({ where: { studentId: student.id, organizationId: orgId }, orderBy: { date: 'desc' } }),
  ]);
  return NextResponse.json({ schedule, payments });
}, { permission: { resource: 'students', action: 'read' } });

export const POST = withApiRoute<Params>(async (req, { tx, orgId, userId, scope, perms, params }) => {
  // Encaissement depuis la fiche : droit dédié, ou droit d'écriture sur le module Paiements.
  if (!perms.can('students.collect', 'write') && !perms.can('payments', 'write')) {
    throw new ApiError(403, 'Permission insuffisante pour encaisser un paiement.', 'FORBIDDEN');
  }
  const body = recordPaymentSchema.parse(await req.json());
  const student = await findOrgScopedOrThrow(() =>
    tx.student.findFirst({ where: { id: params.id, organizationId: orgId, ...scope.student() } })
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
}, { permission: { resource: 'students', action: 'read' } });
