import useSWR from 'swr';
import { toQueryString } from '@/lib/api/client';
import type { ReportsSummaryDTO, FormationReportDTO, FinanceSeriesPointDTO, DateRangeParams } from '@/lib/api/types';

export function useReportsSummary(range: DateRangeParams) {
  const key = `/api/reports/summary${toQueryString(range as Record<string, string | undefined>)}`;
  const { data, error, isLoading } = useSWR<ReportsSummaryDTO>(key);
  return { summary: data, error, isLoading };
}

export function useFormationReports(range: DateRangeParams) {
  const key = `/api/reports/formations${toQueryString(range as Record<string, string | undefined>)}`;
  const { data, error, isLoading } = useSWR<{ data: FormationReportDTO[] }>(key);
  return { formationReports: data?.data ?? [], error, isLoading };
}

export function useFinanceSeries(range: DateRangeParams) {
  const key = `/api/reports/finance-series${toQueryString(range as Record<string, string | undefined>)}`;
  const { data, error, isLoading } = useSWR<{ data: FinanceSeriesPointDTO[] }>(key);
  return { financeSeries: data?.data ?? [], error, isLoading };
}
