export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, organizations } from '@/lib/db/schema';
import { and, eq, ilike, or, desc, count, sql } from 'drizzle-orm';
import { withAdminRoute } from '@/lib/api/admin-handler';

export const GET = withAdminRoute(async (_req, { searchParams }) => {
  const search = searchParams.get('search')?.trim() || '';
  const organizationId = searchParams.get('organizationId') || '';
  const role = searchParams.get('role') || '';
  const isSuperAdminParam = searchParams.get('isSuperAdmin');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '15', 10)));

  const filters = [];
  if (isSuperAdminParam === 'true') filters.push(eq(users.isSuperAdmin, true));
  else if (isSuperAdminParam === 'false') filters.push(eq(users.isSuperAdmin, false));
  if (organizationId && organizationId !== 'all') filters.push(eq(users.organizationId, organizationId));
  if (role && role !== 'all') filters.push(sql`${role} = ANY(${users.roles})`);
  if (search) filters.push(or(
    ilike(users.firstName, `%${search}%`), ilike(users.lastName, `%${search}%`),
    ilike(users.email, `%${search}%`), ilike(users.matricule, `%${search}%`),
  )!);
  const where = filters.length ? and(...filters) : undefined;

  const [totalRow] = await db.select({ value: count() }).from(users).where(where);
  const rows = await db.select({
    id: users.id, matricule: users.matricule, firstName: users.firstName, lastName: users.lastName,
    email: users.email, roles: users.roles, isSuperAdmin: users.isSuperAdmin, status: users.status,
    createdAt: users.createdAt, organizationId: users.organizationId,
    organization: { id: organizations.id, name: organizations.name, status: organizations.status },
  }).from(users).leftJoin(organizations, eq(organizations.id, users.organizationId))
    .where(where).orderBy(desc(users.createdAt)).limit(pageSize).offset((page - 1) * pageSize);
  const total = Number(totalRow?.value ?? 0);
  return NextResponse.json({
    users: rows,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});
