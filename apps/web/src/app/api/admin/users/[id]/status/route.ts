import { NextResponse } from 'next/server';
import { withAdminRoute } from '@/lib/api/admin-handler';
import { logAuditEvent } from '@/lib/audit/audit-logger';

export const PATCH = withAdminRoute(async (req, { prisma, adminUser, params }) => {
  const { id } = params;
  const { status, reason } = await req.json();

  if (!status || !['actif', 'inactif'].includes(status)) {
    return NextResponse.json(
      { error: 'Statut invalide. Valeurs acceptées : actif, inactif.' },
      { status: 400 }
    );
  }

  // Empêcher un Super Admin de désactiver son propre compte
  if (id === adminUser.id && status === 'inactif') {
    return NextResponse.json(
      { error: 'Vous ne pouvez pas désactiver votre propre compte Super Administrateur.' },
      { status: 400 }
    );
  }

  const targetUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!targetUser) {
    return NextResponse.json(
      { error: 'Utilisateur non trouvé.' },
      { status: 404 }
    );
  }

  // Si l'utilisateur cible est un Super Admin et qu'on le désactive, s'assurer qu'il en reste au moins un actif
  if (targetUser.isSuperAdmin && status === 'inactif') {
    const activeSuperAdminsCount = await prisma.user.count({
      where: { isSuperAdmin: true, status: 'actif' },
    });
    if (activeSuperAdminsCount <= 1) {
      return NextResponse.json(
        { error: 'Impossible de désactiver le dernier Super Administrateur actif de la plateforme.' },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { status },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      status: true,
      isSuperAdmin: true,
    },
  });

  await logAuditEvent({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    actorName: 'Super Admin',
    action: status === 'actif' ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
    resource: 'User',
    resourceId: id,
    details: {
      targetEmail: targetUser.email,
      targetName: `${targetUser.firstName} ${targetUser.lastName}`,
      newStatus: status,
      reason: reason || 'Non précisé',
    },
  });

  return NextResponse.json({
    success: true,
    user: updated,
    message: `Le compte de ${updated.firstName} ${updated.lastName} est désormais ${status}.`,
  });
});
