import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { withApiRoute } from '@/lib/api/handler';
import { ApiError } from '@/lib/api/errors';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { ROLES } from '@/lib/auth/roles';
import { generateRandomPassword } from '@/lib/business/matricule';
import { logAuditEvent } from '@/lib/audit/audit-logger';

type Params = { id: string };

/**
 * Réinitialise le mot de passe d'un utilisateur de l'organisation et renvoie un mot de passe
 * provisoire, affiché une seule fois à l'administrateur (même mécanisme qu'à la création).
 * Réservé au rôle ADMIN : une permission `users:write` accordée à un rôle personnalisé ne
 * suffit pas. Son propre mot de passe se change via /api/users/me/password (ancien mot de passe exigé).
 */
export const POST = withApiRoute<Params>(async (_req, { tx, orgId, userId, scope, params }) => {
  if (params.id === userId) {
    throw new ApiError(400, 'Utilisez « Mon Profil » pour changer votre propre mot de passe.', 'SELF_RESET_FORBIDDEN');
  }

  const target = await findOrgScopedOrThrow(
    () =>
      tx.user.findFirst({
        where: { id: params.id, organizationId: orgId, ...scope.user(userId) },
        select: { id: true, matricule: true, firstName: true, lastName: true, email: true, isSuperAdmin: true },
      }),
    'Utilisateur introuvable.'
  );
  if (target.isSuperAdmin) {
    throw new ApiError(403, "Le mot de passe d'un compte Super Administrateur ne peut pas être réinitialisé ici.", 'FORBIDDEN');
  }

  const actor = await findOrgScopedOrThrow(() =>
    tx.user.findFirst({ where: { id: userId, organizationId: orgId }, select: { email: true, firstName: true, lastName: true } })
  );

  const provisionalPassword = generateRandomPassword();
  await tx.user.update({
    where: { id: target.id },
    data: { passwordHash: await bcrypt.hash(provisionalPassword, 10), mustChangePassword: true },
  });

  await logAuditEvent({
    actorId: userId,
    actorEmail: actor.email,
    actorName: `${actor.firstName} ${actor.lastName}`,
    action: 'USER_PASSWORD_RESET',
    resource: 'User',
    resourceId: target.id,
    details: { organizationId: orgId, targetEmail: target.email, targetMatricule: target.matricule },
  });

  return NextResponse.json({ matricule: target.matricule, provisionalPassword });
}, { allowedRoles: [ROLES.ADMIN], permission: { resource: 'users', action: 'write' } });
