import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { PERMISSIONS } from '@/lib/auth/roles';
import { createExpenseSchema } from '@/lib/validation/expenses';

export const GET = withApiRoute(async (_req, { tx, orgId, searchParams }) => {
  const category = searchParams.get('category') ?? undefined;
  const search = searchParams.get('search')?.trim();
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '10', 10) || 10));

  const where = {
    organizationId: orgId,
    ...(category ? { category } : {}),
    ...(search ? { title: { contains: search, mode: 'insensitive' as const } } : {}),
    ...(from || to
      ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
      : {}),
  };

  const [total, expenses] = await Promise.all([
    tx.expense.count({ where }),
    tx.expense.findMany({
      where,
      include: { recordedBy: { select: { firstName: true, lastName: true } } },
      orderBy: { date: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({ data: expenses, meta: { total, page, pageSize } });
}, { allowedRoles: PERMISSIONS.expenses.read });

export const POST = withApiRoute(async (req, { tx, orgId, userId }) => {
  const body = createExpenseSchema.parse(await req.json());
  const expense = await tx.expense.create({
    data: {
      title: body.title,
      amount: body.amount,
      date: new Date(body.date),
      category: body.category,
      description: body.description,
      recordedById: userId,
      organizationId: orgId,
    },
  });
  return NextResponse.json(expense, { status: 201 });
}, { allowedRoles: PERMISSIONS.expenses.write });
