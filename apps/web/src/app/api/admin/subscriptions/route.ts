export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscriptions, organizations, plans } from '@/lib/db/schema';
import { and, eq, ilike, desc, count } from 'drizzle-orm';
import { withAdminRoute } from '@/lib/api/admin-handler';
import { logAuditEvent } from '@/lib/audit/audit-logger';

export const GET = withAdminRoute(async (_req, { searchParams }) => {
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search')?.trim() || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '15', 10)));
  const filters = [];
  if (status && status !== 'all') filters.push(eq(subscriptions.status, status));
  if (search) filters.push(ilike(organizations.name, `%${search}%`));
  const where = filters.length ? and(...filters) : undefined;

  const [totalRow] = await db.select({ value: count() }).from(subscriptions)
    .leftJoin(organizations, eq(organizations.id, subscriptions.organizationId)).where(where);
  const rows = await db.select({ subscription: subscriptions, organization: organizations, plan: plans })
    .from(subscriptions)
    .leftJoin(organizations, eq(organizations.id, subscriptions.organizationId))
    .leftJoin(plans, eq(plans.id, subscriptions.planId))
    .where(where).orderBy(desc(subscriptions.endDate)).limit(pageSize).offset((page - 1) * pageSize);
  const now = new Date();
  const enhanced = rows.map(({ subscription, organization, plan }) => {
    let computedStatus = subscription.status;
    if (new Date(subscription.endDate) < now && subscription.status !== 'suspended') computedStatus = 'expired';
    const daysLeft = Math.ceil((new Date(subscription.endDate).getTime() - now.getTime()) / 86400000);
    return { ...subscription, status: computedStatus, daysLeft, organization, plan: plan?.name ?? '-', planId: subscription.planId };
  });
  const total = Number(totalRow?.value ?? 0);
  return NextResponse.json({ subscriptions: enhanced, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
});

export const PATCH = withAdminRoute(async (req, { adminUser }) => {
  const body = await req.json();
  const { id, planId, status, endDate, maxCenters, maxStudents } = body;
  if (!id) return NextResponse.json({ error: "L'identifiant de la souscription est obligatoire." }, { status: 400 });
  const [existing] = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
  if (!existing) return NextResponse.json({ error: 'Abonnement introuvable.' }, { status: 404 });
  const [updated] = await db.update(subscriptions).set({
    planId: planId || existing.planId,
    status: status || existing.status,
    endDate: endDate ? new Date(endDate) : existing.endDate,
    maxCenters: maxCenters !== undefined ? Number(maxCenters) : existing.maxCenters,
    maxStudents: maxStudents !== undefined ? Number(maxStudents) : existing.maxStudents,
  }).where(eq(subscriptions.id, id)).returning();
  if (status && status !== existing.status) {
    const orgStatus = ['active', 'trial'].includes(status) ? 'actif' : 'suspendu';
    await db.update(organizations).set({ status: orgStatus }).where(eq(organizations.id, existing.organizationId));
  }
  const [organization] = await db.select().from(organizations).where(eq(organizations.id, existing.organizationId)).limit(1);
  const [plan] = updated.planId ? await db.select().from(plans).where(eq(plans.id, updated.planId)).limit(1) : [];
  await logAuditEvent({
    actorId: adminUser.id, actorEmail: adminUser.email, actorName: 'Super Admin',
    action: 'SUBSCRIPTION_UPDATED', resource: 'Subscription', resourceId: id,
    details: { organizationName: organization?.name, plan: plan?.name, status: updated.status, endDate: updated.endDate },
  });
  return NextResponse.json({ success: true, subscription: { ...updated, organization, plan }, message: 'Abonnement mis à jour avec succès.' });
});
