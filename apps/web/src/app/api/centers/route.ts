import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { PERMISSIONS } from '@/lib/auth/roles';
import { createCenterSchema } from '@/lib/validation/centers';
import { ApiError } from '@/lib/api/errors';

export const GET = withApiRoute(async (_req, { tx, orgId }) => {
  const centers = await tx.center.findMany({
    where: { organizationId: orgId },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ data: centers });
}, { permission: { resource: 'centers', action: 'read' } });

export const POST = withApiRoute(async (req, { tx, orgId }) => {
  const body = createCenterSchema.parse(await req.json());
  
  const sub = await tx.subscription.findUnique({
    where: { organizationId: orgId },
    select: { maxCenters: true, plan: true },
  });

  if (!sub) {
    throw new ApiError(400, 'Abonnement introuvable.', 'SUBSCRIPTION_NOT_FOUND');
  }

  const centersCount = await tx.center.count({
    where: { organizationId: orgId },
  });

  if (sub.maxCenters !== -1 && centersCount >= sub.maxCenters) {
    throw new ApiError(
      403,
      `Quota atteint. Votre plan actuel (${sub.plan?.name || 'Essai'}) est limité à ${sub.maxCenters} centre(s). Veuillez contacter l'administrateur de Warriors Management via admin@warriors-management.com pour passer à un plan supérieur.`,
      'QUOTA_EXCEEDED'
    );
  }

  const center = await tx.center.create({ data: { ...body, organizationId: orgId } });
  return NextResponse.json(center, { status: 201 });
}, { permission: { resource: 'centers', action: 'write' } });
