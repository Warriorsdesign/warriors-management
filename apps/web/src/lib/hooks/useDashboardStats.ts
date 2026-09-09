import useSWR from 'swr';
import type { DashboardStatsDTO } from '@/lib/api/types';

export function useDashboardStats() {
  const { data, error, isLoading } = useSWR<DashboardStatsDTO>('/api/dashboard/stats');
  return { stats: data, error, isLoading };
}
