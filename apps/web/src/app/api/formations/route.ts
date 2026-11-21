export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { createFormationSchema } from '@/lib/validation/formations';
import { regenerateLevels, toFormationDTO } from '@/lib/business/formations';
import { assertOrgCenters } from '@/lib/db/scoped';
import { parseCenterIds } from '@/lib/api/centerFilter';
import { formations, formationCenters } from '@/lib/db/schema';
import { and, eq, ilike, asc, inArray } from 'drizzle-orm';

export const GET = withApiRoute(async (_req, { tx, orgId, scope, searchParams }) => {
  const search = searchParams.get('search')?.trim();
  const centerIds = scope.effective(parseCenterIds(searchParams));
  const filters = [eq(formations.organizationId, orgId)];
  if (search) filters.push(ilike(formations.name, `%${search}%`));
  if (centerIds.length) {
    const links = await tx.select({ formationId: formationCenters.formationId }).from(formationCenters).where(inArray(formationCenters.centerId, centerIds));
    const ids = Array.from(new Set(links.map((link) => link.formationId)));
    filters.push(ids.length ? inArray(formations.id, ids) : eq(formations.id, '__aucune_formation__'));
  }
  const rows = await tx.select().from(formations).where(and(...filters)).orderBy(asc(formations.name));
  const data = await Promise.all(rows.map(async (formation) => {
    const links = await tx.select({ centerId: formationCenters.centerId }).from(formationCenters).where(eq(formationCenters.formationId, formation.id));
    const visibleLinks = scope.formation() === null ? links : links.filter((link) => scope.formation()!.includes(link.centerId));
    return toFormationDTO({ ...formation, centers: visibleLinks.map((link) => ({ id: link.centerId })), centerCount: links.length });
  }));
  return NextResponse.json({ data });
}, { permission: { resource: 'formations', action: 'read' } });

export const POST = withApiRoute(async (req, { tx, orgId, scope }) => {
  const { centerIds, ...body } = createFormationSchema.parse(await req.json());
  await assertOrgCenters(tx, orgId, centerIds);
  scope.assertAssignableCenters(centerIds);
  const levels = body.hasLevels ? regenerateLevels(null, body.levelCount!) : [];
  const [formation] = await tx.insert(formations).values({
    ...body,
    levels,
    organizationId: orgId,
  }).returning();
  await Promise.all(centerIds.map((centerId) => tx.insert(formationCenters).values({ formationId: formation.id, centerId })));
  const dto = toFormationDTO({ ...formation, centers: centerIds.map((id) => ({ id })), centerCount: centerIds.length });
  return NextResponse.json(dto, { status: 201 });
}, { permission: { resource: 'formations', action: 'write' } });
