export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';
import { and, eq, ilike, or, desc, count } from 'drizzle-orm';
import { withAdminRoute } from '@/lib/api/admin-handler';

export const GET = withAdminRoute(async (_req, { searchParams }) => {
  const action = searchParams.get('action') || '';
  const resource = searchParams.get('resource') || '';
  const search = searchParams.get('search')?.trim() || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));

  const filters = [];
  if (action && action !== 'all') filters.push(eq(auditLogs.action, action));
  if (resource && resource !== 'all') filters.push(eq(auditLogs.resource, resource));
  if (search) {
    filters.push(or(
      ilike(auditLogs.actorEmail, `%${search}%`), ilike(auditLogs.actorName, `%${search}%`),
      ilike(auditLogs.action, `%${search}%`), ilike(auditLogs.resourceId, `%${search}%`),
    )!);
  }

  const where = filters.length ? and(...filters) : undefined;
  const [totalRow] = await db.select({ value: count() }).from(auditLogs).where(where);
  const logs = await db.select().from(auditLogs).where(where).orderBy(desc(auditLogs.createdAt)).limit(pageSize).offset((page - 1) * pageSize);
  const total = Number(totalRow?.value ?? 0);

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
