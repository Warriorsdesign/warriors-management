import type { DateRange } from '@/lib/business/reports';

export function parseDateRange(searchParams: URLSearchParams): DateRange {
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  return {
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  };
}
