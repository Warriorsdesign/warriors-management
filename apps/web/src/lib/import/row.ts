import type { ImportRowIssue } from '@/lib/api/types';
import { CellError } from './cells';
import type { CellValue, ColumnDef, RawRow } from './types';

/**
 * Lit les cellules d'une ligne en collectant TOUTES ses erreurs (et non la première seulement),
 * pour que l'utilisateur corrige son fichier en une seule passe.
 */
export class RowReader {
  private failed = false;

  constructor(
    private readonly raw: RawRow,
    private readonly columns: ColumnDef[],
    private readonly issues: ImportRowIssue[]
  ) {}

  get row(): number {
    return this.raw.row;
  }

  get hasErrors(): boolean {
    return this.failed;
  }

  private label(key?: string): string | undefined {
    return key ? this.columns.find((c) => c.key === key)?.label ?? key : undefined;
  }

  read<T>(key: string, convert: (value: CellValue) => T): T | undefined {
    try {
      return convert(this.raw.values[key] ?? null);
    } catch (err) {
      if (!(err instanceof CellError)) throw err;
      this.error(err.message, key);
      return undefined;
    }
  }

  error(message: string, key?: string): void {
    this.failed = true;
    this.issues.push({ row: this.raw.row, column: this.label(key), message, kind: 'error' });
  }

  duplicate(message: string, key?: string): void {
    this.failed = true;
    this.issues.push({ row: this.raw.row, column: this.label(key), message, kind: 'duplicate' });
  }
}

/**
 * Index insensible à la casse/aux accents d'entités de l'organisation par nom. Un même nom
 * peut désigner plusieurs entités (les noms ne sont pas uniques en base) : l'appelant
 * signale alors l'ambiguïté au lieu de choisir arbitrairement.
 */
export function indexByName<T>(items: T[], name: (item: T) => string, normalize: (s: string) => string) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = normalize(name(item));
    const list = map.get(key);
    if (list) list.push(item);
    else map.set(key, [item]);
  }
  return map;
}
