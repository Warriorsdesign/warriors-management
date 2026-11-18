import { NextResponse } from 'next/server';
import { withAdminRoute } from '@/lib/api/admin-handler';
import { logAuditEvent } from '@/lib/audit/audit-logger';

export const POST = withAdminRoute(async (req, { prisma, adminUser, params }) => {
  const { id } = params;
  const { status, reason } = await req.json();

  if (!status || !['actif', 'suspendu'].includes(status)) {
    return NextResponse.json(
      { error: 'Statut invalide. Valeurs autorisées : actif, suspendu.' },
      { status: 400 }
    );
  }

  const organization = await prisma.organization.findUnique({
    where: { id },
    include: { subscription: true },
  });

  if (!organization) {
    return NextResponse.json(
      { error: 'Organisation non trouvée.' },
      { status: 404 }
    );
  }

  // Mise à jour du statut de l'organisation
  const updated = await prisma.organization.update({
    where: { id },
    data: { status },
  });

  // Si on suspend, on peut également marquer la souscription en suspended
  if (status === 'suspendu' && organization.subscription) {
    await prisma.subscription.update({
      where: { organizationId: id },
      data: { status: 'suspended' },
    });
  } else if (status === 'actif' && organization.subscription?.status === 'suspended') {
    // Si on réactive, remettre la souscription en active si la date n'est pas dépassée
    const isStillValid = new Date(organization.subscription.endDate) > new Date();
    await prisma.subscription.update({
      where: { organizationId: id },
      data: { status: isStillValid ? 'active' : 'expired' },
    });
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
