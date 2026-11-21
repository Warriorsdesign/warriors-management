import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { withApiRoute } from '@/lib/api/handler';
import { ApiError } from '@/lib/api/errors';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { ROLES } from '@/lib/auth/roles';
import { generateRandomPassword } from '@/lib/business/matricule';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import { users, centerUsers } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

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

  const [targetRow] = await tx.select({ id: users.id, matricule: users.matricule, firstName: users.firstName, lastName: users.lastName, email: users.email, isSuperAdmin: users.isSuperAdmin }).from(users).where(and(eq(users.id, params.id), eq(users.organizationId, orgId))).limit(1);
  const target = await findOrgScopedOrThrow(async () => targetRow, 'Utilisateur introuvable.');
  if (scope.centerIds !== null) {
    const targetLinks = await tx.select({ centerId: centerUsers.centerId }).from(centerUsers).where(eq(centerUsers.userId, target.id));
    if (!targetLinks.some((link) => scope.centerIds!.includes(link.centerId))) throw new ApiError(404, "Utilisateur introuvable.", "NOT_FOUND");
  }
  if (target.isSuperAdmin) {
    throw new ApiError(403, "Le mot de passe d'un compte Super Administrateur ne peut pas être réinitialisé ici.", 'FORBIDDEN');
  }

  const [actorRow] = await tx.select({ email: users.email, firstName: users.firstName, lastName: users.lastName }).from(users).where(and(eq(users.id, userId), eq(users.organizationId, orgId))).limit(1);
  const actor = await findOrgScopedOrThrow(async () => actorRow);

  const provisionalPassword = generateRandomPassword();
  await tx.update(users).set({ passwordHash: await bcrypt.hash(provisionalPassword, 10), mustChangePassword: true }).where(eq(users.id, target.id));

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
