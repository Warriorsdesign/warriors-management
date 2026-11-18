import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { createExpenseSchema } from '@/lib/validation/expenses';
import { parseCenterIds } from '@/lib/api/centerFilter';
import { ApiError } from '@/lib/api/errors';

export const GET = withApiRoute(async (_req, { tx, orgId, scope, searchParams }) => {
  const category = searchParams.get('category') ?? undefined;
  const search = searchParams.get('search')?.trim();
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const centerIds = scope.effective(parseCenterIds(searchParams));
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '10', 10) || 10));

  const where = {
    organizationId: orgId,
    ...(category ? { category } : {}),
    ...(search ? { title: { contains: search, mode: 'insensitive' as const } } : {}),
    ...(centerIds.length ? { centerId: { in: centerIds } } : {}),
    ...(from || to
      ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
      : {}),
  };

  const [total, expenses] = await Promise.all([
    tx.expense.count({ where }),
    tx.expense.findMany({
      where,
      include: {
        recordedBy: { select: { firstName: true, lastName: true } },
        center: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({ data: expenses, meta: { total, page, pageSize } });
}, { permission: { resource: 'expenses', action: 'read' } });

export const POST = withApiRoute(async (req, { tx, orgId, userId, scope }) => {
  const body = createExpenseSchema.parse(await req.json());
  scope.assertCenter(body.centerId);

  const center = await tx.center.findFirst({ where: { id: body.centerId, organizationId: orgId } });
  if (!center) throw new ApiError(400, 'Centre introuvable.', 'CENTER_NOT_FOUND');

  const expense = await tx.expense.create({
    data: {
      title: body.title,
      amount: body.amount,
      date: new Date(body.date),
      category: body.category,
      description: body.description,
      centerId: body.centerId,
      recordedById: userId,
      organizationId: orgId,
    },
  });
  return NextResponse.json(expense, { status: 201 });
}, { permission: { resource: 'expenses', action: 'write' } });
