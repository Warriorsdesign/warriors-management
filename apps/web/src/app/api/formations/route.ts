import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { withApiRoute } from '@/lib/api/handler';
import { PERMISSIONS } from '@/lib/auth/roles';
import { createFormationSchema } from '@/lib/validation/formations';
import { regenerateLevels } from '@/lib/business/formations';

export const GET = withApiRoute(async (req, { tx, orgId, searchParams }) => {
  const search = searchParams.get('search')?.trim();
  const formations = await tx.formation.findMany({
    where: {
      organizationId: orgId,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ data: formations });
}, { allowedRoles: PERMISSIONS.formations.read });

export const POST = withApiRoute(async (req, { tx, orgId }) => {
  const body = createFormationSchema.parse(await req.json());
  const levels = body.hasLevels ? regenerateLevels(null, body.levelCount!) : [];
  const formation = await tx.formation.create({
    data: { ...body, levels: levels as unknown as Prisma.InputJsonValue, organizationId: orgId },
  });
  return NextResponse.json(formation, { status: 201 });
}, { allowedRoles: PERMISSIONS.formations.write });
