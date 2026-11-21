export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { withAdminRoute } from '@/lib/api/admin-handler';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import { db } from '@/lib/db';
import { organizations, subscriptions, centers, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET = withAdminRoute(async (_req, { params }) => {
  const { id } = params;

  const [organization] = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  if (!organization) {
    return NextResponse.json({ error: 'Organisation non trouvée.' }, { status: 404 });
  }
  const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.organizationId, id)).limit(1);
  const orgCenters = await db.select().from(centers).where(eq(centers.organizationId, id));
  const orgUsers = await db.select().from(users).where(eq(users.organizationId, id));
  const organizationDetail = { ...organization, subscription, centers: orgCenters, users: orgUsers };


  return NextResponse.json({ organization: organizationDetail });
});

export const PATCH = withAdminRoute(async (req, { adminUser, params }) => {
  const { id } = params;
  const body = await req.json();
  const { name, email, phone, address } = body;

  const [existing] = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);

  if (!existing) {
    return NextResponse.json(
      { error: 'Organisation non trouvée.' },
      { status: 404 }
    );
  }

  const [updated] = await db.update(organizations).set({
      name: name !== undefined ? name.trim() : existing.name,
      email: email !== undefined ? email?.trim() || null : existing.email,
      phone: phone !== undefined ? phone?.trim() || null : existing.phone,
    address: address !== undefined ? address?.trim() || null : existing.address,
  }).where(eq(organizations.id, id)).returning();

  await logAuditEvent({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    actorName: 'Super Admin',
    action: 'ORGANIZATION_UPDATED',
    resource: 'Organization',
    resourceId: id,
    details: {
      previous: { name: existing.name, email: existing.email },
      updated: { name: updated.name, email: updated.email },
    },
  });

  return NextResponse.json({ success: true, organization: updated });
});
