export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow, assertOrgCenters, assertOrgRoles } from '@/lib/db/scoped';
import { ApiError } from '@/lib/api/errors';
import { updateUserSchema } from '@/lib/validation/users';
import { assertCanAssignRoles } from '@/lib/auth/permissions';
import { users, centerUsers, centers } from '@/lib/db/schema';
import { and, eq, count, sql } from 'drizzle-orm';

type Params = { id: string };

export const GET = withApiRoute<Params>(async (_req, { tx, orgId, userId, scope, params }) => {
  const [row] = await tx.select().from(users).where(and(eq(users.id, params.id), eq(users.organizationId, orgId))).limit(1);
  const user = await findOrgScopedOrThrow(async () => row);
  const links = await tx.select({ id: centers.id, name: centers.name }).from(centerUsers).innerJoin(centers, eq(centers.id, centerUsers.centerId)).where(eq(centerUsers.userId, user.id));
  const visible = scope.centerIds === null ? links : links.filter((center) => scope.centerIds!.includes(center.id));
  if (scope.centerIds !== null && visible.length === 0 && user.id !== userId) throw new ApiError(404, "Utilisateur introuvable.", "NOT_FOUND");
  const response = { id: user.id, matricule: user.matricule, firstName: user.firstName, lastName: user.lastName, email: user.email, roles: user.roles, status: user.status, avatarUrl: user.avatarUrl, centers: visible };
  return NextResponse.json(response);
}, { permission: { resource: 'users', action: 'read' } });

/**
 * Un utilisateur ne peut ni modifier (rôles, statut, centres) ni supprimer son propre compte
 * depuis la gestion des utilisateurs : son profil se modifie via /api/users/me.
 */
function assertNotSelf(targetId: string, userId: string, action: string): void {
  if (targetId === userId) {
    throw new ApiError(403, `Vous ne pouvez pas ${action} votre propre compte. Utilisez « Mon Profil ».`, 'SELF_MANAGEMENT_FORBIDDEN');
  }
}

export const PATCH = withApiRoute<Params>(async (req, { tx, orgId, userId, scope, perms, params }) => {
  assertNotSelf(params.id, userId, 'modifier');
  const body = updateUserSchema.parse(await req.json());
  const [row] = await tx.select().from(users).where(and(eq(users.id, params.id), eq(users.organizationId, orgId))).limit(1);
  const user = await findOrgScopedOrThrow(async () => row);

  if (scope.centerIds !== null) {
    const targetLinks = await tx.select({ centerId: centerUsers.centerId }).from(centerUsers).where(eq(centerUsers.userId, user.id));
    if (!targetLinks.some((link) => scope.centerIds!.includes(link.centerId))) throw new ApiError(404, "Utilisateur introuvable.", "NOT_FOUND");
  }

  // Un non-administrateur ne gère que des comptes dont les droits n'excèdent pas les siens.
  if (scope.centerIds !== null) {
    const targetLinks = await tx.select({ centerId: centerUsers.centerId }).from(centerUsers).where(eq(centerUsers.userId, user.id));
    if (!targetLinks.some((link) => scope.centerIds!.includes(link.centerId))) throw new ApiError(404, "Utilisateur introuvable.", "NOT_FOUND");
  }
  await assertCanAssignRoles(tx, orgId, perms, user.roles);
  if (body.roles !== undefined) await assertCanAssignRoles(tx, orgId, perms, body.roles);

  if (body.matricule !== undefined && body.matricule !== user.matricule) {
    throw new ApiError(400, 'Le matricule ne peut pas être modifié.', 'MATRICULE_IMMUTABLE');
  }

  // Vérification de l'auto-lockout (empêcher de retirer le dernier ADMIN)
  if (body.roles !== undefined && !body.roles.includes('ADMIN') && user.roles.includes('ADMIN')) {
    const [adminRow] = await tx.select({ value: count() }).from(users).where(and(eq(users.organizationId, orgId), sql`${users.roles} @> ARRAY['ADMIN']::text[]`, eq(users.status, 'actif')));
    const adminCount = Number(adminRow?.value ?? 0);
    if (adminCount <= 1) {
      throw new ApiError(403, 'Impossible de retirer le rôle ADMIN. Vous êtes le dernier administrateur actif.', 'LAST_ADMIN');
    }
  }

  // Empêcher la désactivation du dernier ADMIN
  if (body.status === 'inactif' && user.status === 'actif' && user.roles.includes('ADMIN')) {
    const [adminRow] = await tx.select({ value: count() }).from(users).where(and(eq(users.organizationId, orgId), sql`${users.roles} @> ARRAY['ADMIN']::text[]`, eq(users.status, 'actif')));
    const adminCount = Number(adminRow?.value ?? 0);
    if (adminCount <= 1) {
      throw new ApiError(403, 'Impossible de désactiver le dernier administrateur actif.', 'LAST_ADMIN');
    }
  }

  if (body.roles !== undefined) await assertOrgRoles(tx, orgId, body.roles);
  if (body.centerIds !== undefined) {
    await assertOrgCenters(tx, orgId, body.centerIds);
    scope.assertAssignableCenters(body.centerIds);
  }

  const { centerIds, ...rest } = body;
  const [updated] = await tx.update(users).set(rest).where(eq(users.id, user.id)).returning({
    id: users.id, matricule: users.matricule, firstName: users.firstName, lastName: users.lastName,
    email: users.email, roles: users.roles, status: users.status, avatarUrl: users.avatarUrl,
  });
  if (centerIds !== undefined) {
    await tx.delete(centerUsers).where(eq(centerUsers.userId, user.id));
    await Promise.all(centerIds.map((centerId) => tx.insert(centerUsers).values({ centerId, userId: user.id })));
  }
  return NextResponse.json(updated);
}, { permission: { resource: 'users', action: 'write' } });

export const DELETE = withApiRoute<Params>(async (_req, { tx, orgId, userId, scope, perms, params }) => {
  assertNotSelf(params.id, userId, 'supprimer');
  const [row] = await tx.select().from(users).where(and(eq(users.id, params.id), eq(users.organizationId, orgId))).limit(1);
  const user = await findOrgScopedOrThrow(async () => row);
  if (scope.centerIds !== null) {
    const targetLinks = await tx.select({ centerId: centerUsers.centerId }).from(centerUsers).where(eq(centerUsers.userId, user.id));
    if (!targetLinks.some((link) => scope.centerIds!.includes(link.centerId))) throw new ApiError(404, "Utilisateur introuvable.", "NOT_FOUND");
  }
  await assertCanAssignRoles(tx, orgId, perms, user.roles);

  // Empêcher la suppression du dernier ADMIN
  if (user.roles.includes('ADMIN') && user.status === 'actif') {
    const [adminRow] = await tx.select({ value: count() }).from(users).where(and(eq(users.organizationId, orgId), sql`${users.roles} @> ARRAY['ADMIN']::text[]`, eq(users.status, 'actif')));
    const adminCount = Number(adminRow?.value ?? 0);
    if (adminCount <= 1) {
      throw new ApiError(403, 'Impossible de supprimer le dernier administrateur actif.', 'LAST_ADMIN');
    }
  }

  await tx.delete(users).where(eq(users.id, user.id));
  return NextResponse.json({ success: true });
}, { permission: { resource: 'users', action: 'write' } });
