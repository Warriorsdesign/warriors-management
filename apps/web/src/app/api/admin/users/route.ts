import { NextResponse } from 'next/server';
import { withAdminRoute } from '@/lib/api/admin-handler';

export const GET = withAdminRoute(async (req, { prisma, searchParams }) => {
  const search = searchParams.get('search')?.trim() || '';
  const organizationId = searchParams.get('organizationId') || '';
  const role = searchParams.get('role') || '';
  const isSuperAdminParam = searchParams.get('isSuperAdmin');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '15', 10)));

  const where: any = {};

  if (isSuperAdminParam === 'true') {
    where.isSuperAdmin = true;
  } else if (isSuperAdminParam === 'false') {
    where.isSuperAdmin = false;
  }

  if (organizationId && organizationId !== 'all') {
    where.organizationId = organizationId;
  }

  if (role && role !== 'all') {
    where.roles = { has: role };
  }

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { matricule: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        matricule: true,
        firstName: true,
        lastName: true,
        email: true,
        roles: true,
        isSuperAdmin: true,
        status: true,
        createdAt: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    users,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});
