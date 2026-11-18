import { NextResponse } from 'next/server';
import { withAdminRoute } from '@/lib/api/admin-handler';

export const GET = withAdminRoute(async (req, { prisma }) => {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '10', 10)));
  const status = searchParams.get('status');
  const orgId = searchParams.get('organizationId');

  const where = {
    ...(status ? { status } : {}),
    ...(orgId ? { organizationId: orgId } : {}),
  };

  const [total, payments] = await Promise.all([
    prisma.platformPayment.count({ where }),
    prisma.platformPayment.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        organization: { select: { id: true, name: true } },
        plan: { select: { id: true, name: true } },
      },
    }),
  ]);

  return NextResponse.json({
    data: payments,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});
