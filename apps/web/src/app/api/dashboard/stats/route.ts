import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { getDashboardStats } from '@/lib/business/dashboard';
import { parseCenterIds } from '@/lib/api/centerFilter';
import { PERIOD_TYPES, parseOffsetMinutes, resolvePeriod, type PeriodType } from '@/lib/api/periodRange';

export const GET = withApiRoute(async (_req, { tx, orgId, scope, perms, searchParams }) => {
  const centerIds = scope.effective(parseCenterIds(searchParams));
  const formationIds = searchParams.getAll('formationId').filter(Boolean);

  // Par défaut : la journée en cours ; les autres périodes s'appliquent via le filtre.
  const periodParam = searchParams.get('period');
  const periodType: PeriodType = PERIOD_TYPES.includes(periodParam as PeriodType) ? (periodParam as PeriodType) : 'today';
  const period = resolvePeriod(
    periodType,
    searchParams.get('from') ?? undefined,
    searchParams.get('to') ?? undefined,
    new Date(),
    parseOffsetMinutes(searchParams.get('tz'))
  );

  const stats = await getDashboardStats(
    tx, orgId, centerIds, formationIds, period, scope.formation(), perms.can('dashboard.finance', 'read')
  );
  return NextResponse.json(stats);
}, { permission: { resource: 'dashboard', action: 'read' } });
