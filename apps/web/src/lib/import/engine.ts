import { createHash } from 'crypto';
import type { NextRequest } from 'next/server';
import { ApiError } from '@/lib/api/errors';
import type { ImportAnalysisDTO } from '@/lib/api/types';
import type { TenantClient } from '@/lib/db';
import { hasPermission } from '@/lib/auth/permissions';
import { toText } from './cells';
import { MAX_FILE_BYTES, parseWorkbook, type ParsedFile } from './workbook';
import type { ImportContext, ImportDefinition, ValidationResult } from './types';

const PREVIEW_ROWS = 50;
const MAX_ISSUES_RETURNED = 1000;

export async function assertImportPermission(
  definition: ImportDefinition,
  ctx: { tx: TenantClient; orgId: string; roles: string[] }
): Promise<void> {
  if (!(await hasPermission(ctx.tx, ctx.orgId, ctx.roles, definition.resource, 'write'))) {
    throw new ApiError(403, 'Permission insuffisante pour cette action.', 'FORBIDDEN');
  }
}

/** Lit le fichier d'un formulaire multipart ("file"), avec les contrôles de taille en amont. */
export async function readUploadedFile(req: NextRequest): Promise<{ buffer: Buffer; form: FormData }> {
  const declared = Number(req.headers.get('content-length') ?? 0);
  if (declared > MAX_FILE_BYTES + 64 * 1024) {
    throw new ApiError(413, 'Le fichier dépasse la taille maximale autorisée (4 Mo).', 'FILE_TOO_LARGE');
  }
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new ApiError(400, 'Requête invalide : fichier attendu.', 'FILE_REQUIRED');
  }
  const file = form.get('file');
  if (!file || typeof file === 'string') throw new ApiError(400, 'Aucun fichier reçu.', 'FILE_REQUIRED');
  if (file.size > MAX_FILE_BYTES) {
    throw new ApiError(413, 'Le fichier dépasse la taille maximale autorisée (4 Mo).', 'FILE_TOO_LARGE');
  }
  return { buffer: Buffer.from(await file.arrayBuffer()), form };
}

export interface AnalysisRun {
  parsed: ParsedFile;
  result: ValidationResult<unknown> | null;
  analysis: ImportAnalysisDTO;
}

/**
 * Analyse complète d'un fichier : structure puis validation métier. N'écrit jamais en base ;
 * rejouée telle quelle au moment de la confirmation (le serveur ne fait jamais confiance à
 * des lignes pré-analysées renvoyées par le navigateur).
 */
export async function analyzeFile(definition: ImportDefinition, buffer: Buffer, ctx: ImportContext): Promise<AnalysisRun> {
  const fileHash = createHash('sha256').update(buffer).digest('hex');
  const parsed = await parseWorkbook(buffer, definition.columns);
  const result = parsed.fileErrors.length === 0 ? await definition.validate(parsed.rows, ctx) : null;

  const issues = result?.issues ?? [];
  const errorRows = new Set(issues.filter((i) => i.kind === 'error').map((i) => i.row));
  const duplicateRows = new Set(issues.filter((i) => i.kind === 'duplicate' && !errorRows.has(i.row)).map((i) => i.row));
  const fileErrors = [...parsed.fileErrors, ...(result?.fileErrors ?? [])];
  const warnings = [...parsed.warnings, ...(result?.warnings ?? [])];
  if (issues.length > MAX_ISSUES_RETURNED) {
    warnings.push(`Seules les ${MAX_ISSUES_RETURNED} premières anomalies sont affichées : téléchargez le rapport pour la liste complète.`);
  }
  const validRows = result?.valid.length ?? 0;

  const analysis: ImportAnalysisDTO = {
    type: definition.type,
    fileHash,
    totalRows: parsed.rows.length,
    validRows,
    invalidRows: errorRows.size,
    duplicateRows: duplicateRows.size,
    fileErrors,
    warnings,
    issues: issues.slice(0, MAX_ISSUES_RETURNED),
    preview: parsed.rows.slice(0, PREVIEW_ROWS).map((raw) => ({
      row: raw.row,
      values: Object.fromEntries(definition.columns.map((c) => [c.key, toText(raw.values[c.key] ?? null)])),
    })),
    columns: definition.columns.map((c) => ({ key: c.key, label: c.label })),
    canImport: fileErrors.length === 0 && validRows > 0,
  };

  return { parsed, result, analysis };
}
