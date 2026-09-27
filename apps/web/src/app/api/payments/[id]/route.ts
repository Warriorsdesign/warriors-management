import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { PERMISSIONS } from '@/lib/auth/roles';
import { updatePaymentSchema } from '@/lib/validation/payments';
import { rebuildScheduleForStudent } from '@/lib/business/paymentSchedule';

type Params = { id: string };

export const GET = withApiRoute<Params>(async (_req, { tx, orgId, scope, params }) => {
  const payment = await findOrgScopedOrThrow(() =>
    tx.payment.findFirst({
      where: { id: params.id, organizationId: orgId, ...scope.payment() },
      include: { recordedBy: { select: { id: true, firstName: true, lastName: true } } },
    })
  );
  return NextResponse.json(payment);
}, { permission: { resource: 'payments', action: 'read' } });

export const PATCH = withApiRoute<Params>(async (req, { tx, orgId, scope, params }) => {
  const body = updatePaymentSchema.parse(await req.json());
  const payment = await findOrgScopedOrThrow(() =>
    tx.payment.findFirst({ where: { id: params.id, organizationId: orgId, ...scope.payment() } })
  );

  const updated = await tx.payment.update({
    where: { id: payment.id },
    data: {
      ...body,
      date: body.date ? new Date(body.date) : undefined,
    },
  });

  const schedule = await rebuildScheduleForStudent(tx, payment.studentId, orgId);

  return NextResponse.json({ payment: updated, schedule });
}, { permission: { resource: 'payments', action: 'write' } });

export const DELETE = withApiRoute<Params>(async (_req, { tx, orgId, scope, params }) => {
  const payment = await findOrgScopedOrThrow(() =>
    tx.payment.findFirst({ where: { id: params.id, organizationId: orgId, ...scope.payment() } })
  );

  await tx.payment.delete({ where: { id: payment.id } });
  const schedule = await rebuildScheduleForStudent(tx, payment.studentId, orgId);

  return NextResponse.json({ success: true, schedule });
}, { permission: { resource: 'payments', action: 'write' } });
