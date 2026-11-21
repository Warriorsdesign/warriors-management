import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { updateLevelSchema } from '@/lib/validation/formations';
import { assertFormationEditable, type Level } from '@/lib/business/formations';
import { formations } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

type Params = { id: string; levelId: string };

export const PATCH = withApiRoute<Params>(async (req, { tx, orgId, scope, params }) => {
  const body = updateLevelSchema.parse(await req.json());
  const [row] = await tx.select().from(formations).where(and(eq(formations.id, params.id), eq(formations.organizationId, orgId))).limit(1);
  const formation = await findOrgScopedOrThrow(async () => row);
  await assertFormationEditable(tx, formation.id, scope);

  const levels = (formation.levels as Level[] | null) ?? [];
  const levelExists = levels.some((l) => l.id === params.levelId);
  if (!levelExists) {
    return NextResponse.json({ error: 'Level not found', code: 'NOT_FOUND' }, { status: 404 });
  }
  const updatedLevels = levels.map((l) => (l.id === params.levelId ? { ...l, name: body.name } : l));

  const [updated] = await tx.update(formations).set({ levels: updatedLevels }).where(eq(formations.id, formation.id)).returning();
  return NextResponse.json(updated);
}, { permission: { resource: 'formations', action: 'write' } });
