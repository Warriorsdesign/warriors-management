import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { PERMISSIONS } from '@/lib/auth/roles';
import { getDashboardStats } from '@/lib/business/dashboard';
import { parseCenterIds } from '@/lib/api/centerFilter';
import { resolvePeriod, type PeriodType } from '@/lib/api/periodRange';

const PERIOD_TYPES: PeriodType[] = ['this_month', 'last_month', 'quarter', 'year', 'custom'];

export const GET = withApiRoute(async (_req, { tx, orgId, searchParams }) => {
  const centerIds = parseCenterIds(searchParams);
  const formationIds = searchParams.getAll('formationId').filter(Boolean);

  const periodParam = searchParams.get('period');
  const periodType: PeriodType = PERIOD_TYPES.includes(periodParam as PeriodType) ? (periodParam as PeriodType) : 'this_month';
  const customFrom = searchParams.get('from');
  const customTo = searchParams.get('to');
  const period = resolvePeriod(periodType, customFrom ? new Date(customFrom) : undefined, customTo ? new Date(customTo) : undefined);

  const stats = await getDashboardStats(tx, orgId, centerIds, formationIds, period);
  return NextResponse.json(stats);
}, { permission: { resource: 'dashboard', action: 'read' } });
