export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { ROLES } from '@/lib/auth/roles';
import { createCenterSchema } from '@/lib/validation/centers';
import { ApiError } from '@/lib/api/errors';
import { CONTACT } from '@/lib/config/contact';
import { assertCenterNameAvailable, lockCenterCreation } from '@/lib/business/centers';
import { centers, subscriptions, plans } from '@/lib/db/schema';
import { and, eq, asc, count, inArray } from 'drizzle-orm';

export const GET = withApiRoute(async (_req, { tx, orgId, scope }) => {
  const allowed = scope.centerIds;
  const rows = await tx.select().from(centers).where(allowed
    ? and(eq(centers.organizationId, orgId), inArray(centers.id, allowed))
    : eq(centers.organizationId, orgId)).orderBy(asc(centers.name));
  return NextResponse.json({ data: rows });
}, { permission: { resource: 'centers', action: 'read' } });

export const POST = withApiRoute(async (req, { tx, orgId }) => {
  const body = createCenterSchema.parse(await req.json());
  await lockCenterCreation(tx, orgId);
  await assertCenterNameAvailable(tx, orgId, body.name);

  const [sub] = await tx.select({ maxCenters: subscriptions.maxCenters, planName: plans.name }).from(subscriptions).leftJoin(plans, eq(plans.id, subscriptions.planId)).where(eq(subscriptions.organizationId, orgId)).limit(1);
  if (!sub) {
    throw new ApiError(400, 'Abonnement introuvable.', 'SUBSCRIPTION_NOT_FOUND');
  }

  const [countRow] = await tx.select({ value: count() }).from(centers).where(eq(centers.organizationId, orgId));
  const centersCount = Number(countRow?.value ?? 0);

  if (sub.maxCenters !== -1 && centersCount >= sub.maxCenters) {
    throw new ApiError(
      403,
      `Quota atteint. Votre plan actuel (${sub.planName || 'Essai'}) est limité à ${sub.maxCenters} centre(s). Pour passer à un forfait supérieur, contactez-nous : ${CONTACT.email} ou WhatsApp ${CONTACT.whatsappDisplay}.`,
      'QUOTA_EXCEEDED'
    );
  }

  const [center] = await tx.insert(centers).values({ ...body, organizationId: orgId }).returning();
  return NextResponse.json(center, { status: 201 });
// Seuls les administrateurs de l'organisation créent des centres (ils définissent le périmètre des utilisateurs).
}, { allowedRoles: [ROLES.ADMIN], permission: { resource: 'centers', action: 'write' } });
