import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { getImportDefinition } from '@/lib/import/registry';
import { assertImportPermission } from '@/lib/import/engine';
import { buildTemplate } from '@/lib/import/workbook';
import { xlsxResponseHeaders } from '@/lib/import/http';

export const runtime = 'nodejs';

/** Modèle Excel du type demandé, pré-rempli avec les listes propres à l'organisation. */
export const GET = withApiRoute<{ type: string }>(async (_req, { tx, orgId, userId, roles, scope, perms, params }) => {
  const definition = getImportDefinition(params.type);
  await assertImportPermission(definition, { tx, orgId, roles });
  const lists = await definition.loadTemplateLists({ tx, orgId, userId, scope, perms });
  const buffer = await buildTemplate(definition, lists);
  return new NextResponse(new Uint8Array(buffer), { headers: xlsxResponseHeaders(`modele-import-${definition.type}.xlsx`) });
});
