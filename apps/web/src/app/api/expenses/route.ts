export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { createExpenseSchema } from '@/lib/validation/expenses';
import { parseCenterIds } from '@/lib/api/centerFilter';
import { ApiError } from '@/lib/api/errors';
import { expenses, centers, users } from '@/lib/db/schema';
import { and, eq, inArray, gte, lte, ilike, desc, count } from 'drizzle-orm';

export const GET = withApiRoute(async (_req, { tx, orgId, scope, searchParams }) => {
  const category = searchParams.get('category') ?? undefined;
  const search = searchParams.get('search')?.trim();
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const centerIds = scope.effective(parseCenterIds(searchParams));
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '10', 10) || 10));

  const filters = [eq(expenses.organizationId, orgId)];
  if (category) filters.push(eq(expenses.category, category));
  if (search) filters.push(ilike(expenses.title, `%${search}%`));
  if (centerIds.length) filters.push(inArray(expenses.centerId, centerIds));
  if (from) filters.push(gte(expenses.date, new Date(from)));
  if (to) filters.push(lte(expenses.date, new Date(to)));
  const where = and(...filters);


  const [totalRow] = await tx.select({ value: count() }).from(expenses).where(where);
  const rows = await tx.select({
    expense: expenses,
    recordedBy: { firstName: users.firstName, lastName: users.lastName },
    center: { id: centers.id, name: centers.name },
  }).from(expenses)
    .leftJoin(users, eq(users.id, expenses.recordedById))
    .leftJoin(centers, eq(centers.id, expenses.centerId))
    .where(where).orderBy(desc(expenses.date)).limit(pageSize).offset((page - 1) * pageSize);
  const total = Number(totalRow?.value ?? 0);
  const expenseRows = rows.map((row) => ({ ...row.expense, recordedBy: row.recordedBy, center: row.center }));

  return NextResponse.json({ data: expenseRows, meta: { total, page, pageSize } });
}, { permission: { resource: 'expenses', action: 'read' } });

export const POST = withApiRoute(async (req, { tx, orgId, userId, scope }) => {
  const body = createExpenseSchema.parse(await req.json());
  scope.assertCenter(body.centerId);

  const [center] = await tx.select({ id: centers.id }).from(centers).where(and(eq(centers.id, body.centerId), eq(centers.organizationId, orgId))).limit(1);
  if (!center) throw new ApiError(400, 'Centre introuvable.', 'CENTER_NOT_FOUND');

  const [expense] = await tx.insert(expenses).values({
      title: body.title,
      amount: body.amount,
      date: new Date(body.date),
      category: body.category,
      description: body.description,
      centerId: body.centerId,
      recordedById: userId,
      organizationId: orgId,
  }).returning();
  return NextResponse.json(expense, { status: 201 });
}, { permission: { resource: 'expenses', action: 'write' } });
