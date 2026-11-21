export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { platformPayments, organizations, plans } from '@/lib/db/schema';
import { and, eq, desc, count } from 'drizzle-orm';
import { withAdminRoute } from '@/lib/api/admin-handler';

export const GET = withAdminRoute(async (req) => {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '10', 10)));
  const status = searchParams.get('status');
  const orgId = searchParams.get('organizationId');

  const filters = [];
  if (status) filters.push(eq(platformPayments.status, status));
  if (orgId) filters.push(eq(platformPayments.organizationId, orgId));
  const where = filters.length ? and(...filters) : undefined;

  const [totalRow] = await db.select({ value: count() }).from(platformPayments).where(where);
  const rows = await db.select({
    payment: platformPayments,
    organization: { id: organizations.id, name: organizations.name },
    plan: { id: plans.id, name: plans.name },
  }).from(platformPayments)
    .leftJoin(organizations, eq(organizations.id, platformPayments.organizationId))
    .leftJoin(plans, eq(plans.id, platformPayments.planId))
    .where(where).orderBy(desc(platformPayments.date)).limit(pageSize).offset((page - 1) * pageSize);
  const payments = rows.map((row) => ({ ...row.payment, organization: row.organization, plan: row.plan }));
  const total = Number(totalRow?.value ?? 0);

  return NextResponse.json({ data: payments, meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) } });
});
