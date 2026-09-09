import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { PERMISSIONS } from '@/lib/auth/roles';
import { createCenterSchema } from '@/lib/validation/centers';

export const GET = withApiRoute(async (_req, { tx, orgId }) => {
  const centers = await tx.center.findMany({
    where: { organizationId: orgId },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ data: centers });
}, { allowedRoles: PERMISSIONS.centers.read });

export const POST = withApiRoute(async (req, { tx, orgId }) => {
  const body = createCenterSchema.parse(await req.json());
  const center = await tx.center.create({ data: { ...body, organizationId: orgId } });
  return NextResponse.json(center, { status: 201 });
}, { allowedRoles: PERMISSIONS.centers.write });
