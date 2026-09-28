import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { getImportDefinition } from '@/lib/import/registry';
import { analyzeFile, assertImportPermission, readUploadedFile } from '@/lib/import/engine';

export const runtime = 'nodejs';
export const maxDuration = 60;

/** Étape 1 de l'import : analyse et validation complète, sans aucune écriture en base. */
export const POST = withApiRoute<{ type: string }>(async (req, { tx, orgId, userId, roles, scope, perms, params }) => {
  const definition = getImportDefinition(params.type);
  await assertImportPermission(definition, { tx, orgId, roles });
  const { buffer } = await readUploadedFile(req);
  const { analysis } = await analyzeFile(definition, buffer, { tx, orgId, userId, scope, perms });
  return NextResponse.json(analysis);
}, { transactionTimeout: 55000 });
