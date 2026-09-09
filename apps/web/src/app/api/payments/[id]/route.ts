import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { PERMISSIONS } from '@/lib/auth/roles';
import { updatePaymentSchema } from '@/lib/validation/payments';
import { rebuildScheduleForStudent } from '@/lib/business/paymentSchedule';

type Params = { id: string };

export const GET = withApiRoute<Params>(async (_req, { tx, orgId, params }) => {
  const payment = await findOrgScopedOrThrow(() =>
    tx.payment.findFirst({
      where: { id: params.id, organizationId: orgId },
      include: { recordedBy: { select: { id: true, firstName: true, lastName: true } } },
    })
  );
  return NextResponse.json(payment);
}, { allowedRoles: PERMISSIONS.payments.read });

export const PATCH = withApiRoute<Params>(async (req, { tx, orgId, params }) => {
  const body = updatePaymentSchema.parse(await req.json());
  const payment = await findOrgScopedOrThrow(() =>
    tx.payment.findFirst({ where: { id: params.id, organizationId: orgId } })
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
}, { allowedRoles: PERMISSIONS.payments.write });

export const DELETE = withApiRoute<Params>(async (_req, { tx, orgId, params }) => {
  const payment = await findOrgScopedOrThrow(() =>
    tx.payment.findFirst({ where: { id: params.id, organizationId: orgId } })
  );

  await tx.payment.delete({ where: { id: payment.id } });
  const schedule = await rebuildScheduleForStudent(tx, payment.studentId, orgId);

  return NextResponse.json({ success: true, schedule });
}, { allowedRoles: PERMISSIONS.payments.write });
