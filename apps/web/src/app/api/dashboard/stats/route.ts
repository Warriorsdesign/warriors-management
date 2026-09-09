import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { PERMISSIONS } from '@/lib/auth/roles';
import { getDashboardStats } from '@/lib/business/dashboard';

export const GET = withApiRoute(async (_req, { tx, orgId }) => {
  const stats = await getDashboardStats(tx, orgId);
  return NextResponse.json(stats);
}, { allowedRoles: PERMISSIONS.dashboard.read });
