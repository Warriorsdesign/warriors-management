import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { getImportDefinition } from '@/lib/import/registry';
import { analyzeFile, assertImportPermission, readUploadedFile } from '@/lib/import/engine';
import { buildErrorReport } from '@/lib/import/workbook';
import { xlsxResponseHeaders } from '@/lib/import/http';

export const runtime = 'nodejs';
export const maxDuration = 60;

/** Rapport Excel des lignes rejetées (valeurs d'origine + colonne "Erreurs"), ré-importable après correction. */
export const POST = withApiRoute<{ type: string }>(async (req, { tx, orgId, userId, roles, scope, params }) => {
  const definition = getImportDefinition(params.type);
  await assertImportPermission(definition, { tx, orgId, roles });
  const { buffer } = await readUploadedFile(req);
  const { parsed, result } = await analyzeFile(definition, buffer, { tx, orgId, userId, scope });
  const report = await buildErrorReport(definition, parsed.rows, result?.issues ?? []);
  return new NextResponse(new Uint8Array(report), { headers: xlsxResponseHeaders(`erreurs-import-${definition.type}.xlsx`) });
}, { transactionTimeout: 55000 });
