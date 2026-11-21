export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { updateExpenseSchema } from '@/lib/validation/expenses';
import { ApiError } from '@/lib/api/errors';
import { expenses, centers } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

type Params = { id: string };

export const GET = withApiRoute<Params>(async (_req, { tx, orgId, scope, params }) => {
  const [row] = await tx.select().from(expenses).where(and(eq(expenses.id, params.id), eq(expenses.organizationId, orgId))).limit(1);
  const expense = await findOrgScopedOrThrow(async () => row);
  scope.assertCenter(expense.centerId);
  return NextResponse.json(expense);
}, { permission: { resource: 'expenses', action: 'read' } });

export const PATCH = withApiRoute<Params>(async (req, { tx, orgId, scope, params }) => {
  const body = updateExpenseSchema.parse(await req.json());
  const [row] = await tx.select().from(expenses).where(and(eq(expenses.id, params.id), eq(expenses.organizationId, orgId))).limit(1);
  const expense = await findOrgScopedOrThrow(async () => row);
  scope.assertCenter(expense.centerId);
  if (body.centerId) {
    scope.assertCenter(body.centerId);
    const [center] = await tx.select({ id: centers.id }).from(centers).where(and(eq(centers.id, body.centerId), eq(centers.organizationId, orgId))).limit(1);
    if (!center) throw new ApiError(400, 'Centre introuvable.', 'CENTER_NOT_FOUND');
  }
  const [updated] = await tx.update(expenses).set({ ...body, date: body.date ? new Date(body.date) : undefined }).where(eq(expenses.id, expense.id)).returning();
  return NextResponse.json(updated);
}, { permission: { resource: 'expenses', action: 'write' } });

export const DELETE = withApiRoute<Params>(async (_req, { tx, orgId, scope, params }) => {
  const [row] = await tx.select().from(expenses).where(and(eq(expenses.id, params.id), eq(expenses.organizationId, orgId))).limit(1);
  const expense = await findOrgScopedOrThrow(async () => row);
  scope.assertCenter(expense.centerId);
  await tx.delete(expenses).where(eq(expenses.id, expense.id));
  return NextResponse.json({ success: true });
}, { permission: { resource: 'expenses', action: 'write' } });
