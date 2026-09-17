export type PeriodType = 'this_month' | 'last_month' | 'quarter' | 'year' | 'custom';

export interface ResolvedPeriod {
  type: PeriodType;
  from: Date;
  to: Date;
  prevFrom: Date;
  prevTo: Date;
  label: string;
  prevLabel: string;
}

const MONTH_LABELS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1, 0, 0, 0, 0);
}

function endOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0, 23, 59, 59, 999);
}

function monthRange(year: number, month: number): { from: Date; to: Date; label: string } {
  return { from: startOfMonth(year, month), to: endOfMonth(year, month), label: `${MONTH_LABELS[((month % 12) + 12) % 12]} ${year}` };
}

function quarterRange(year: number, quarterIndex: number): { from: Date; to: Date; label: string } {
  const startMonth = quarterIndex * 3;
  return {
    from: startOfMonth(year, startMonth),
    to: endOfMonth(year, startMonth + 2),
    label: `T${quarterIndex + 1} ${year}`,
  };
}

function yearRange(year: number): { from: Date; to: Date; label: string } {
  return { from: new Date(year, 0, 1, 0, 0, 0, 0), to: new Date(year, 11, 31, 23, 59, 59, 999), label: String(year) };
}

/**
 * Résout un type de période (onglets du tableau de bord) en bornes concrètes, plus les
 * bornes de la période équivalente précédente (pour les deltas "vs période précédente").
 * `custom` prend from/to tels quels ; la période précédente est alors la même durée,
 * immédiatement avant `from`.
 */
export function resolvePeriod(type: PeriodType, customFrom?: Date, customTo?: Date, now: Date = new Date()): ResolvedPeriod {
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (type) {
    case 'this_month': {
      const current = monthRange(year, month);
      const prev = monthRange(year, month - 1);
      return { type, ...current, prevFrom: prev.from, prevTo: prev.to, prevLabel: prev.label };
    }
    case 'last_month': {
      const current = monthRange(year, month - 1);
      const prev = monthRange(year, month - 2);
      return { type, ...current, prevFrom: prev.from, prevTo: prev.to, prevLabel: prev.label };
    }
    case 'quarter': {
      const quarterIndex = Math.floor(month / 3);
      const current = quarterRange(year, quarterIndex);
      const prevQuarterIndex = quarterIndex - 1;
      const prev = prevQuarterIndex >= 0 ? quarterRange(year, prevQuarterIndex) : quarterRange(year - 1, 3);
      return { type, ...current, prevFrom: prev.from, prevTo: prev.to, prevLabel: prev.label };
    }
    case 'year': {
      const current = yearRange(year);
      const prev = yearRange(year - 1);
      return { type, ...current, prevFrom: prev.from, prevTo: prev.to, prevLabel: prev.label };
    }
    case 'custom': {
      const from = customFrom ?? startOfMonth(year, month);
      const to = customTo ?? now;
      const durationMs = to.getTime() - from.getTime();
      const prevTo = new Date(from.getTime() - 1);
      const prevFrom = new Date(prevTo.getTime() - durationMs);
      return {
        type, from, to, prevFrom, prevTo,
        label: `${from.toLocaleDateString('fr-FR')} - ${to.toLocaleDateString('fr-FR')}`,
        prevLabel: `${prevFrom.toLocaleDateString('fr-FR')} - ${prevTo.toLocaleDateString('fr-FR')}`,
      };
    }
  }
}
