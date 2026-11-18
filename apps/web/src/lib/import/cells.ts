import type { CellValue } from './types';

/**
 * Normalisation utilisée pour comparer en-têtes et références par nom : insensible à la
 * casse, aux accents, à la ponctuation et aux espaces multiples ("Centre  Akwa" = "centre akwa").
 */
export function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Erreur de conversion d'une cellule, rattachée à sa colonne par l'appelant. */
export class CellError extends Error {}

export function toText(value: CellValue): string {
  if (value === null) return '';
  if (value instanceof Date) return formatDate(value);
  if (typeof value === 'number') {
    // Téléphones saisis comme nombres : 699112233 et non "699112233.0" ou "6.99e8".
    return Number.isInteger(value) ? value.toFixed(0) : String(value);
  }
  return value.trim();
}

export function optionalText(value: CellValue, maxLength = 200): string | undefined {
  const text = toText(value);
  if (!text) return undefined;
  if (text.length > maxLength) throw new CellError(`Valeur trop longue (${maxLength} caractères maximum).`);
  return text;
}

export function requiredText(value: CellValue, maxLength = 200): string {
  const text = optionalText(value, maxLength);
  if (!text) throw new CellError('Champ obligatoire vide.');
  return text;
}

/**
 * Accepte les nombres Excel et les saisies texte usuelles : "150 000", "150 000 FCFA",
 * "150.000" (séparateur de milliers) ou "12,5" (virgule décimale).
 */
export function optionalNumber(value: CellValue): number | undefined {
  if (value === null) return undefined;
  if (typeof value === 'number') return value;
  if (value instanceof Date) throw new CellError('Nombre attendu.');
  let text = value.replace(/fcfa|xaf|f\s*cfa/gi, '').replace(/[\s  ]/g, '');
  if (!text) return undefined;
  if (/^\d{1,3}(\.\d{3})+$/.test(text)) text = text.replace(/\./g, '');
  text = text.replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(text)) throw new CellError(`"${value.trim()}" n'est pas un nombre valide.`);
  return Number(text);
}

export function optionalInt(value: CellValue, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}): number | undefined {
  const n = optionalNumber(value);
  if (n === undefined) return undefined;
  if (!Number.isInteger(n)) throw new CellError('Nombre entier attendu.');
  if (n < min || n > max) throw new CellError(`Valeur attendue entre ${min} et ${max}.`);
  return n;
}

export function requiredInt(value: CellValue, bounds?: { min?: number; max?: number }): number {
  const n = optionalInt(value, bounds);
  if (n === undefined) throw new CellError('Champ obligatoire vide.');
  return n;
}

export function optionalAmount(value: CellValue): number | undefined {
  const n = optionalNumber(value);
  if (n === undefined) return undefined;
  if (n < 0) throw new CellError('Le montant ne peut pas être négatif.');
  return Math.round(n);
}

export function requiredAmount(value: CellValue): number {
  const n = optionalAmount(value);
  if (n === undefined) throw new CellError('Champ obligatoire vide.');
  return n;
}

function utcDate(year: number, month: number, day: number): Date | null {
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
  return d;
}

/**
 * Dates acceptées : cellule date Excel, numéro de série Excel, "jj/mm/aaaa", "jj-mm-aaaa",
 * "jj.mm.aaaa" ou "aaaa-mm-jj". Toujours ramenées à minuit UTC (jour calendaire saisi).
 */
export function optionalDate(value: CellValue): Date | undefined {
  if (value === null) return undefined;
  let date: Date | null = null;
  if (value instanceof Date) {
    date = utcDate(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
  } else if (typeof value === 'number') {
    const ms = Math.round((value - 25569) * 86400 * 1000);
    const d = new Date(ms);
    date = utcDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  } else {
    const text = value.trim();
    if (!text) return undefined;
    let m = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
    if (m) date = utcDate(Number(m[3]), Number(m[2]), Number(m[1]));
    m = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) date = utcDate(Number(m[1]), Number(m[2]), Number(m[3]));
  }
  if (!date || date.getUTCFullYear() < 1950 || date.getUTCFullYear() > 2100) {
    throw new CellError(`Date invalide${typeof value === 'string' ? ` "${value.trim()}"` : ''} (format attendu : jj/mm/aaaa).`);
  }
  return date;
}

export function requiredDate(value: CellValue): Date {
  const d = optionalDate(value);
  if (!d) throw new CellError('Champ obligatoire vide.');
  return d;
}

export function formatDate(d: Date): string {
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
}

/**
 * Résout une valeur texte parmi un ensemble de libellés/synonymes (comparaison normalisée).
 * `choices` : valeur interne -> libellés acceptés ; le premier libellé est celui affiché.
 */
export function optionalChoice<T extends string>(
  value: CellValue,
  choices: Record<T, readonly string[]>
): T | undefined {
  const text = toText(value);
  if (!text) return undefined;
  const key = normalizeKey(text);
  for (const [code, labels] of Object.entries(choices) as [T, readonly string[]][]) {
    if (normalizeKey(code) === key || labels.some((l) => normalizeKey(l) === key)) return code;
  }
  const allowed = (Object.values(choices) as readonly string[][]).map((labels) => labels[0]).join(', ');
  throw new CellError(`Valeur "${text}" non reconnue. Valeurs possibles : ${allowed}.`);
}

export function choiceLabels<T extends string>(choices: Record<T, readonly string[]>): string[] {
  return (Object.values(choices) as readonly string[][]).map((labels) => labels[0]);
}
