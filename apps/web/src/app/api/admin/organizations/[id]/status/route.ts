import { NextResponse } from 'next/server';
import { withAdminRoute } from '@/lib/api/admin-handler';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import { db } from '@/lib/db';
import { organizations, subscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const POST = withAdminRoute(async (req, { adminUser, params }) => {
  const { id } = params;
  const { status, reason } = await req.json();

  if (!status || !['actif', 'suspendu'].includes(status)) {
    return NextResponse.json(
      { error: 'Statut invalide. Valeurs autorisées : actif, suspendu.' },
      { status: 400 }
    );
  }

  const [organization] = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.organizationId, id)).limit(1);

  if (!organization) {
    return NextResponse.json(
      { error: 'Organisation non trouvée.' },
      { status: 404 }
    );
  }

  // Mise à jour du statut de l'organisation
  const [updated] = await db.update(organizations).set({ status }).where(eq(organizations.id, id)).returning();

  // Si on suspend, on peut également marquer la souscription en suspended
  if (status === 'suspendu' && subscription) {
    await db.update(subscriptions).set({ status: 'suspended' }).where(eq(subscriptions.organizationId, id));
  } else if (status === 'actif' && subscription?.status === 'suspended') {
    // Si on réactive, remettre la souscription en active si la date n'est pas dépassée
    const isStillValid = new Date(subscription.endDate) > new Date();
    await db.update(subscriptions).set({ status: isStillValid ? 'active' : 'expired' }).where(eq(subscriptions.organizationId, id));
  }

  // Journalisation d'audit
  const actionName = status === 'suspendu' ? 'ORGANIZATION_SUSPENDED' : 'ORGANIZATION_ACTIVATED';
  await logAuditEvent({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    actorName: 'Super Admin',
    action: actionName,
    resource: 'Organization',
    resourceId: id,
    details: {
      organizationName: organization.name,
      newStatus: status,
      previousStatus: organization.status,
      reason: reason || 'Aucun motif renseigné',
    },
  });

  return NextResponse.json({
    success: true,
    status: updated.status,
    message:
      status === 'suspendu'
        ? `L'organisation "${organization.name}" a été suspendue avec succès.`
        : `L'organisation "${organization.name}" a été réactivée avec succès.`,
  });
});
