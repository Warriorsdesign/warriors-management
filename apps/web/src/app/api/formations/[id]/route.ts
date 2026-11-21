export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { updateFormationSchema } from '@/lib/validation/formations';
import {
  regenerateLevels, assertFormationDeletable, assertFormationEditable, assertCentersKeepClasses,
  toFormationDTO, type Level,
} from '@/lib/business/formations';
import { assertOrgCenters } from '@/lib/db/scoped';
import { formations, formationCenters } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

type Params = { id: string };

export const GET = withApiRoute<Params>(async (_req, { tx, orgId, scope, params }) => {
  const [formationRow] = await tx.select().from(formations).where(and(eq(formations.id, params.id), eq(formations.organizationId, orgId))).limit(1);
  const formation = await findOrgScopedOrThrow(async () => formationRow);
  const links = await tx.select({ centerId: formationCenters.centerId }).from(formationCenters).where(eq(formationCenters.formationId, formation.id));
  const visible = scope.formation() === null ? links : links.filter((l) => scope.formation()!.includes(l.centerId));
  return NextResponse.json(toFormationDTO({ ...formation, centers: visible.map((l) => ({ id: l.centerId })), centerCount: links.length }));
}, { permission: { resource: 'formations', action: 'read' } });

export const PATCH = withApiRoute<Params>(async (req, { tx, orgId, scope, params }) => {
  const { centerIds, ...body } = updateFormationSchema.parse(await req.json());
  const [formationRow] = await tx.select().from(formations).where(and(eq(formations.id, params.id), eq(formations.organizationId, orgId))).limit(1);
  const formation = await findOrgScopedOrThrow(async () => formationRow);
  await assertFormationEditable(tx, formation.id, scope);
  if (centerIds) {
    await assertOrgCenters(tx, orgId, centerIds);
    scope.assertAssignableCenters(centerIds);
    await assertCentersKeepClasses(tx, formation.id, centerIds);
  }

  const hasLevels = body.hasLevels ?? formation.hasLevels;
  const levelCount = body.levelCount ?? formation.levelCount ?? undefined;
  const levels = hasLevels && levelCount
    ? regenerateLevels(formation.levels as Level[] | null, levelCount)
    : formation.levels;

  const [updated] = await tx.update(formations).set({
      ...body,
      levels,
    }).where(eq(formations.id, formation.id)).returning();
    if (centerIds) {
      await tx.delete(formationCenters).where(eq(formationCenters.formationId, formation.id));
      await Promise.all(centerIds.map((centerId) => tx.insert(formationCenters).values({ formationId: formation.id, centerId })));
    }
  const links = await tx.select({ centerId: formationCenters.centerId }).from(formationCenters).where(eq(formationCenters.formationId, updated.id));
  return NextResponse.json(toFormationDTO({ ...updated, centers: links.map((l) => ({ id: l.centerId })), centerCount: links.length }));
}, { permission: { resource: 'formations', action: 'write' } });

export const DELETE = withApiRoute<Params>(async (_req, { tx, orgId, scope, params }) => {
  const [formationRow] = await tx.select().from(formations).where(and(eq(formations.id, params.id), eq(formations.organizationId, orgId))).limit(1);
  const formation = await findOrgScopedOrThrow(async () => formationRow);
  await assertFormationEditable(tx, formation.id, scope);
  await assertFormationDeletable(tx, formation.id);
  await tx.delete(formationCenters).where(eq(formationCenters.formationId, formation.id));
  await tx.delete(formations).where(eq(formations.id, formation.id));
  return NextResponse.json({ success: true });
}, { permission: { resource: 'formations', action: 'write' } });
