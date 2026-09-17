import useSWR from 'swr';
import { toQueryString } from '@/lib/api/client';
import type { ReportsSummaryDTO, FormationReportDTO, FinanceSeriesPointDTO, DateRangeParams } from '@/lib/api/types';

export function useReportsSummary(range: DateRangeParams, centerId?: string[]) {
  const key = `/api/reports/summary${toQueryString({ ...range, centerId })}`;
  const { data, error, isLoading } = useSWR<ReportsSummaryDTO>(key);
  return { summary: data, error, isLoading };
}

export function useFormationReports(range: DateRangeParams, centerId?: string[]) {
  const key = `/api/reports/formations${toQueryString({ ...range, centerId })}`;
  const { data, error, isLoading } = useSWR<{ data: FormationReportDTO[] }>(key);
  return { formationReports: data?.data ?? [], error, isLoading };
}

export function useFinanceSeries(range: DateRangeParams, centerId?: string[]) {
  const key = `/api/reports/finance-series${toQueryString({ ...range, centerId })}`;
  const { data, error, isLoading } = useSWR<{ data: FinanceSeriesPointDTO[] }>(key);
  return { financeSeries: data?.data ?? [], error, isLoading };
}
