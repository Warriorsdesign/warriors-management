import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { PERMISSIONS } from '@/lib/auth/roles';
import { getFormationReports } from '@/lib/business/reports';
import { parseDateRange } from '@/lib/api/dateRange';

export const GET = withApiRoute(async (_req, { tx, orgId, searchParams }) => {
  const data = await getFormationReports(tx, orgId, parseDateRange(searchParams));
  return NextResponse.json({ data });
}, { allowedRoles: PERMISSIONS.dashboard.read });
