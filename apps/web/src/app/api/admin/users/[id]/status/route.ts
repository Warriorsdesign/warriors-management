import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { and, eq, count } from 'drizzle-orm';
import { withAdminRoute } from '@/lib/api/admin-handler';
import { logAuditEvent } from '@/lib/audit/audit-logger';

export const PATCH = withAdminRoute(async (req, { adminUser, params }) => {
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

  const [targetUser] = await db.select().from(users).where(eq(users.id, id)).limit(1);

  if (!targetUser) {
    return NextResponse.json(
      { error: 'Utilisateur non trouvé.' },
      { status: 404 }
    );
  }

  // Si l'utilisateur cible est un Super Admin et qu'on le désactive, s'assurer qu'il en reste au moins un actif
  if (targetUser.isSuperAdmin && status === 'inactif') {
    const [activeRow] = await db.select({ value: count() }).from(users).where(and(eq(users.isSuperAdmin, true), eq(users.status, 'actif')));
    const activeSuperAdminsCount = Number(activeRow?.value ?? 0);
    if (activeSuperAdminsCount <= 1) {
      return NextResponse.json(
        { error: 'Impossible de désactiver le dernier Super Administrateur actif de la plateforme.' },
        { status: 400 }
      );
    }
  }

  const [updated] = await db.update(users).set({ status }).where(eq(users.id, id)).returning({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      status: users.status,
      isSuperAdmin: users.isSuperAdmin,
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
