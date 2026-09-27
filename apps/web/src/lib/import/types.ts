import type { TenantClient } from '@/lib/db';
import type { CenterScope } from '@/lib/auth/centerScope';
import type { ImportRowIssue, ImportType } from '@/lib/api/types';

/** Valeur de cellule normalisée après lecture du classeur. */
export type CellValue = string | number | Date | null;

export interface ColumnDef {
  key: string;
  /** En-tête affiché dans le modèle (sans l'astérisque des champs obligatoires). */
  label: string;
  required: boolean;
  /** En-têtes alternatifs acceptés à l'import (comparés après normalisation). */
  aliases?: string[];
  /** Instruction affichée dans l'onglet "Instructions" du modèle. */
  help: string;
  /** Liste déroulante du modèle : clé renvoyée par `loadTemplateLists`. */
  list?: string;
  /** Format de cellule appliqué dans le modèle. */
  format?: 'text' | 'number' | 'date';
}

export interface RawRow {
  /** Numéro de ligne Excel (la ligne 1 contient les en-têtes). */
  row: number;
  values: Record<string, CellValue>;
}

export interface ImportContext {
  tx: TenantClient;
  orgId: string;
  userId: string;
  /** Périmètre de centres de l'utilisateur : références (centres, classes, formations) résolues uniquement dedans. */
  scope: CenterScope;
}

export interface PreparedRow<T> {
  row: number;
  data: T;
}

export interface ValidationResult<T> {
  valid: PreparedRow<T>[];
  issues: ImportRowIssue[];
  /** Erreurs bloquant tout l'import (ex : dépassement du plan). */
  fileErrors: string[];
  warnings: string[];
}

/**
 * Contrat d'un type de données importable. Ajouter un nouveau type d'import revient à écrire
 * une définition et à l'enregistrer dans registry.ts - le parsing, le modèle Excel, le rapport
 * d'erreurs et les routes API sont génériques.
 */
export interface ImportDefinition<T = unknown> {
  type: ImportType;
  label: string;
  /** Ressource RolePermission exigée en écriture. */
  resource: 'formations' | 'classes' | 'students';
  columns: ColumnDef[];
  /** Conseils spécifiques affichés dans l'onglet "Instructions". */
  instructions: string[];
  /** Lignes d'exemple (onglet "Exemple" du modèle, jamais importé). Contexte camerounais. */
  examples: Record<string, string | number>[];
  /** Valeurs des listes déroulantes du modèle, propres à l'organisation (centres, formations...). */
  loadTemplateLists(ctx: ImportContext): Promise<Record<string, string[]>>;
  /**
   * Validation complète (format, doublons, références, capacité, plan). Ne doit JAMAIS écrire
   * en base : elle est rejouée à l'identique au moment de la confirmation.
   */
  validate(rows: RawRow[], ctx: ImportContext): Promise<ValidationResult<T>>;
  /** Insère les lignes validées ; appelée dans la transaction qui vient de re-valider. */
  commit(rows: PreparedRow<T>[], ctx: ImportContext): Promise<number>;
}
