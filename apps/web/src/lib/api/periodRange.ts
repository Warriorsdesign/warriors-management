export type PeriodType = 'today' | 'this_month' | 'last_month' | 'quarter' | 'year' | 'custom';

export const PERIOD_TYPES: PeriodType[] = ['today', 'this_month', 'last_month', 'quarter', 'year', 'custom'];

export interface ResolvedPeriod {
  type: PeriodType;
  from: Date;
  to: Date;
  prevFrom: Date;
  prevTo: Date;
  label: string;
  prevLabel: string;
  /** Décalage de l'utilisateur par rapport à UTC, en minutes (UTC+1 = 60) : sert à découper les journées. */
  offsetMinutes: number;
}

const MONTH_LABELS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

const MONTH_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Les bornes de période sont calculées dans le fuseau de l'utilisateur (transmis par le
 * navigateur), et non dans celui du serveur : un serveur en UTC compterait sinon un paiement
 * saisi à 00h30 à Douala (UTC+1) sur la veille.
 */
function localParts(instant: Date, offsetMinutes: number) {
  const shifted = new Date(instant.getTime() + offsetMinutes * 60000);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth(), day: shifted.getUTCDate() };
}

/** Instant UTC correspondant à 00:00:00.000 le jour local (year, month, day) - day/month peuvent déborder. */
function startOfLocalDay(year: number, month: number, day: number, offsetMinutes: number): Date {
  return new Date(Date.UTC(year, month, day) - offsetMinutes * 60000);
}

function endOfLocalDay(year: number, month: number, day: number, offsetMinutes: number): Date {
  return new Date(startOfLocalDay(year, month, day + 1, offsetMinutes).getTime() - 1);
}

function dayLabel(year: number, month: number, day: number): string {
  const d = new Date(Date.UTC(year, month, day));
  return `${d.getUTCDate()} ${MONTH_LABELS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function monthRange(year: number, month: number, offset: number) {
  const d = new Date(Date.UTC(year, month, 1));
  return {
    from: startOfLocalDay(year, month, 1, offset),
    to: endOfLocalDay(year, month + 1, 0, offset),
    label: `${MONTH_LABELS[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
  };
}

function quarterRange(year: number, quarterIndex: number, offset: number) {
  const startMonth = quarterIndex * 3;
  return {
    from: startOfLocalDay(year, startMonth, 1, offset),
    to: endOfLocalDay(year, startMonth + 3, 0, offset),
    label: `T${quarterIndex + 1} ${year}`,
  };
}

function yearRange(year: number, offset: number) {
  return { from: startOfLocalDay(year, 0, 1, offset), to: endOfLocalDay(year, 11, 31, offset), label: String(year) };
}

/** Accepte "AAAA-MM-JJ" (jour local choisi dans le sélecteur) ou une date ISO complète. */
function parseLocalDay(value: string | undefined, offset: number): { year: number; month: number; day: number } | null {
  if (!value) return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return { year: Number(m[1]), month: Number(m[2]) - 1, day: Number(m[3]) };
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : localParts(d, offset);
}

/** Décalage transmis par le navigateur (-getTimezoneOffset()), borné aux fuseaux existants. */
export function parseOffsetMinutes(value: string | null, fallback = -new Date().getTimezoneOffset()): number {
  const n = Number(value);
  return value !== null && Number.isInteger(n) && n >= -840 && n <= 840 ? n : fallback;
}

/**
 * Résout un type de période (onglets du tableau de bord) en bornes concrètes, plus les
 * bornes de la période équivalente précédente (pour les deltas "vs période précédente").
 * `custom` couvre les jours choisis en entier (du début du premier à la fin du dernier) ;
 * la période précédente est alors la même durée, immédiatement avant.
 */
export function resolvePeriod(
  type: PeriodType,
  customFrom?: string,
  customTo?: string,
  now: Date = new Date(),
  offsetMinutes: number = -now.getTimezoneOffset()
): ResolvedPeriod {
  const offset = offsetMinutes;
  const { year, month, day } = localParts(now, offset);

  switch (type) {
    case 'today': {
      return {
        type, offsetMinutes: offset,
        from: startOfLocalDay(year, month, day, offset),
        to: endOfLocalDay(year, month, day, offset),
        label: dayLabel(year, month, day),
        prevFrom: startOfLocalDay(year, month, day - 1, offset),
        prevTo: endOfLocalDay(year, month, day - 1, offset),
        prevLabel: 'hier',
      };
    }
    case 'this_month': {
      const current = monthRange(year, month, offset);
      const prev = monthRange(year, month - 1, offset);
      return { type, offsetMinutes: offset, ...current, prevFrom: prev.from, prevTo: prev.to, prevLabel: prev.label };
    }
    case 'last_month': {
      const current = monthRange(year, month - 1, offset);
      const prev = monthRange(year, month - 2, offset);
      return { type, offsetMinutes: offset, ...current, prevFrom: prev.from, prevTo: prev.to, prevLabel: prev.label };
    }
    case 'quarter': {
      const quarterIndex = Math.floor(month / 3);
      const current = quarterRange(year, quarterIndex, offset);
      const prev = quarterIndex > 0 ? quarterRange(year, quarterIndex - 1, offset) : quarterRange(year - 1, 3, offset);
      return { type, offsetMinutes: offset, ...current, prevFrom: prev.from, prevTo: prev.to, prevLabel: prev.label };
    }
    case 'year': {
      const current = yearRange(year, offset);
      const prev = yearRange(year - 1, offset);
      return { type, offsetMinutes: offset, ...current, prevFrom: prev.from, prevTo: prev.to, prevLabel: prev.label };
    }
    case 'custom': {
      const start = parseLocalDay(customFrom, offset) ?? { year, month, day: 1 };
      const end = parseLocalDay(customTo, offset) ?? { year, month, day };
      let from = startOfLocalDay(start.year, start.month, start.day, offset);
      let to = endOfLocalDay(end.year, end.month, end.day, offset);
      if (to < from) [from, to] = [startOfLocalDay(end.year, end.month, end.day, offset), endOfLocalDay(start.year, start.month, start.day, offset)];
      const days = Math.round((to.getTime() + 1 - from.getTime()) / DAY_MS);
      const prevTo = new Date(from.getTime() - 1);
      const prevFrom = new Date(from.getTime() - days * DAY_MS);
      const fmt = (d: Date) => {
        const p = localParts(d, offset);
        return `${String(p.day).padStart(2, '0')}/${String(p.month + 1).padStart(2, '0')}/${p.year}`;
      };
      return {
        type, offsetMinutes: offset, from, to, prevFrom, prevTo,
        label: `${fmt(from)} - ${fmt(to)}`,
        prevLabel: `${fmt(prevFrom)} - ${fmt(prevTo)}`,
      };
    }
  }
}

/**
 * Jours locaux couverts par la période, bornés à aujourd'hui (pas de jours futurs vides dans
 * la courbe quand la période est "Année" ou "Trimestre").
 */
export function periodDays(period: ResolvedPeriod, now: Date = new Date()) {
  const offset = period.offsetMinutes;
  const today = localParts(now, offset);
  const endOfToday = endOfLocalDay(today.year, today.month, today.day, offset);
  const last = period.to < endOfToday || period.from > endOfToday ? period.to : endOfToday;

  const days: { key: string; label: string; fullLabel: string }[] = [];
  const start = localParts(period.from, offset);
  for (let i = 0; ; i++) {
    const dayStart = startOfLocalDay(start.year, start.month, start.day + i, offset);
    if (dayStart > last) break;
    const p = localParts(dayStart, offset);
    days.push({
      key: dayKey(dayStart, offset),
      label: `${p.day} ${MONTH_SHORT[p.month]}`,
      fullLabel: dayLabel(p.year, p.month, p.day),
    });
  }
  return days;
}

/** Clé "AAAA-MM-JJ" du jour local d'un instant. */
export function dayKey(instant: Date, offsetMinutes: number): string {
  const p = localParts(instant, offsetMinutes);
  return `${p.year}-${String(p.month + 1).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}
