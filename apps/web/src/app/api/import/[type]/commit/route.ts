import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { ApiError } from '@/lib/api/errors';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { getImportDefinition } from '@/lib/import/registry';
import { analyzeFile, assertImportPermission, readUploadedFile } from '@/lib/import/engine';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Étape 2 de l'import : le navigateur renvoie le fichier analysé avec son empreinte et le
 * nombre de lignes valides qui a été présenté à l'utilisateur. Le serveur ré-analyse tout
 * sous verrou puis insère les lignes valides dans une seule transaction (tout ou rien).
 */
export const POST = withApiRoute<{ type: string }>(async (req, { tx, orgId, userId, roles, scope, params }) => {
  const definition = getImportDefinition(params.type);
  await assertImportPermission(definition, { tx, orgId, roles });
  const { buffer, form } = await readUploadedFile(req);
  const expectedHash = String(form.get('fileHash') ?? '');
  const expectedValid = Number(form.get('expectedValidRows'));

  // Sérialise les imports d'une même organisation : deux imports simultanés ne peuvent pas
  // dépasser ensemble le quota du plan ni s'attribuer les mêmes matricules.
  await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))', `import:${orgId}`);

  const { analysis, result } = await analyzeFile(definition, buffer, { tx, orgId, userId, scope });

  if (analysis.fileHash !== expectedHash) {
    throw new ApiError(409, "Le fichier a changé depuis l'analyse. Relancez l'analyse.", 'IMPORT_FILE_CHANGED');
  }
  if (analysis.fileErrors.length > 0 || !result) {
    throw new ApiError(400, analysis.fileErrors.join(' '), 'IMPORT_BLOCKED', { fileErrors: analysis.fileErrors });
  }
  if (!Number.isInteger(expectedValid) || result.valid.length !== expectedValid) {
    throw new ApiError(
      409,
      `Les données ont changé depuis l'analyse (${result.valid.length} ligne(s) valide(s) au lieu de ${expectedValid}). Relancez l'analyse.`,
      'IMPORT_DATA_CHANGED'
    );
  }
  if (result.valid.length === 0) throw new ApiError(400, 'Aucune ligne valide à importer.', 'IMPORT_EMPTY');

  const imported = await definition.commit(result.valid, { tx, orgId, userId, scope });

  const actor = await findOrgScopedOrThrow(() =>
    tx.user.findFirst({ where: { id: userId, organizationId: orgId }, select: { email: true, firstName: true, lastName: true } })
  );
  await logAuditEvent({
    actorId: userId,
    actorEmail: actor.email,
    actorName: `${actor.firstName} ${actor.lastName}`,
    action: 'DATA_IMPORTED',
    resource: 'Organization',
    resourceId: orgId,
    details: { type: definition.type, imported, skipped: analysis.totalRows - imported, fileHash: analysis.fileHash },
  });

  return NextResponse.json({ imported, skipped: analysis.totalRows - imported }, { status: 201 });
}, { transactionTimeout: 55000 });
