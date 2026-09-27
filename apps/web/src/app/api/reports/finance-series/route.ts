import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { PERMISSIONS } from '@/lib/auth/roles';
import { getFinanceSeries } from '@/lib/business/reports';
import { parseDateRange } from '@/lib/api/dateRange';
import { parseCenterIds } from '@/lib/api/centerFilter';

export const GET = withApiRoute(async (_req, { tx, orgId, scope, searchParams }) => {
  const data = await getFinanceSeries(tx, orgId, parseDateRange(searchParams), scope.effective(parseCenterIds(searchParams)));
  return NextResponse.json({ data });
}, { permission: { resource: 'dashboard', action: 'read' } });
