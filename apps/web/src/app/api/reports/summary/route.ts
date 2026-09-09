import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { PERMISSIONS } from '@/lib/auth/roles';
import { getReportsSummary } from '@/lib/business/reports';
import { parseDateRange } from '@/lib/api/dateRange';

export const GET = withApiRoute(async (_req, { tx, orgId, searchParams }) => {
  const summary = await getReportsSummary(tx, orgId, parseDateRange(searchParams));
  return NextResponse.json(summary);
}, { allowedRoles: PERMISSIONS.dashboard.read });
