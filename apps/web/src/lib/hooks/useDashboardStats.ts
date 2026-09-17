import useSWR from 'swr';
import { toQueryString } from '@/lib/api/client';
import type { DashboardStatsDTO } from '@/lib/api/types';

export interface UseDashboardStatsParams {
  centerId?: string[];
  formationId?: string[];
  period?: 'this_month' | 'last_month' | 'quarter' | 'year' | 'custom';
  from?: string;
  to?: string;
}

export function useDashboardStats(params: UseDashboardStatsParams = {}) {
  const key = `/api/dashboard/stats${toQueryString({
    centerId: params.centerId,
    formationId: params.formationId,
    period: params.period,
    from: params.from,
    to: params.to,
  })}`;
  const { data, error, isLoading } = useSWR<DashboardStatsDTO>(key);
  return { stats: data, error, isLoading };
}
