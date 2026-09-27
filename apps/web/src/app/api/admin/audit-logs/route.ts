import { NextResponse } from 'next/server';
import { withAdminRoute } from '@/lib/api/admin-handler';

export const GET = withAdminRoute(async (req, { prisma, searchParams }) => {
  const action = searchParams.get('action') || '';
  const resource = searchParams.get('resource') || '';
  const search = searchParams.get('search')?.trim() || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));

  const where: any = {};

  if (action && action !== 'all') {
    where.action = action;
  }

  if (resource && resource !== 'all') {
    where.resource = resource;
  }

  if (search) {
    where.OR = [
      { actorEmail: { contains: search, mode: 'insensitive' } },
      { actorName: { contains: search, mode: 'insensitive' } },
      { action: { contains: search, mode: 'insensitive' } },
      { resourceId: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return NextResponse.json({
    logs,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});
