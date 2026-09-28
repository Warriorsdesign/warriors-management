import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { getFormationReports } from '@/lib/business/reports';
import { parseDateRange } from '@/lib/api/dateRange';
import { parseCenterIds } from '@/lib/api/centerFilter';

export const GET = withApiRoute(async (_req, { tx, orgId, scope, searchParams }) => {
  const data = await getFormationReports(tx, orgId, parseDateRange(searchParams), scope.effective(parseCenterIds(searchParams)), scope.formation());
  return NextResponse.json({ data });
}, { permission: { resource: 'reports', action: 'read' } });
