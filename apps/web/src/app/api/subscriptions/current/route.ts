export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { countActiveStudents } from '@/lib/business/studentQuota';
import { organizations, subscriptions, plans, centers, platformPayments } from '@/lib/db/schema';
import { eq, desc, count } from 'drizzle-orm';

export const GET = withApiRoute(async (_req, { tx, orgId }) => {
  const [organization] = await tx.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
  if (!organization) throw new Error('Organisation introuvable');


  // Calculer dynamiquement le statut expiré (si on n'a pas encore fait la tâche en background)
  const [sub] = await tx.select().from(subscriptions).where(eq(subscriptions.organizationId, orgId)).limit(1);
  if (sub && new Date(sub.endDate) < new Date() && sub.status !== 'suspended') sub.status = 'expired';
  const [plan] = sub?.planId ? await tx.select().from(plans).where(eq(plans.id, sub.planId)).limit(1) : [undefined];
  const [centerCount] = await tx.select({ value: count() }).from(centers).where(eq(centers.organizationId, orgId));
  const payments = await tx.select().from(platformPayments).where(eq(platformPayments.organizationId, orgId)).orderBy(desc(platformPayments.date));

  return NextResponse.json({
    subscription: sub ? { ...sub, plan } : null,
    usage: {
      centers: Number(centerCount?.value ?? 0),
      // Quota : étudiants actifs seulement (abandons et formations terminées exclus).
      students: await countActiveStudents(tx, orgId),
    },
    payments,
  });
}, { permission: { resource: 'organization', action: 'read' } });
