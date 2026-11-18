import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { updateExpenseSchema } from '@/lib/validation/expenses';
import { ApiError } from '@/lib/api/errors';

type Params = { id: string };

export const GET = withApiRoute<Params>(async (_req, { tx, orgId, scope, params }) => {
  const expense = await findOrgScopedOrThrow(() =>
    tx.expense.findFirst({ where: { id: params.id, organizationId: orgId, ...scope.expense() } })
  );
  return NextResponse.json(expense);
}, { permission: { resource: 'expenses', action: 'read' } });

export const PATCH = withApiRoute<Params>(async (req, { tx, orgId, scope, params }) => {
  const body = updateExpenseSchema.parse(await req.json());
  const expense = await findOrgScopedOrThrow(() =>
    tx.expense.findFirst({ where: { id: params.id, organizationId: orgId, ...scope.expense() } })
  );
  if (body.centerId) {
    scope.assertCenter(body.centerId);
    const center = await tx.center.findFirst({ where: { id: body.centerId, organizationId: orgId } });
    if (!center) throw new ApiError(400, 'Centre introuvable.', 'CENTER_NOT_FOUND');
  }
  const updated = await tx.expense.update({
    where: { id: expense.id },
    data: { ...body, date: body.date ? new Date(body.date) : undefined },
  });
  return NextResponse.json(updated);
}, { permission: { resource: 'expenses', action: 'write' } });

export const DELETE = withApiRoute<Params>(async (_req, { tx, orgId, scope, params }) => {
  const expense = await findOrgScopedOrThrow(() =>
    tx.expense.findFirst({ where: { id: params.id, organizationId: orgId, ...scope.expense() } })
  );
  await tx.expense.delete({ where: { id: expense.id } });
  return NextResponse.json({ success: true });
}, { permission: { resource: 'expenses', action: 'write' } });
