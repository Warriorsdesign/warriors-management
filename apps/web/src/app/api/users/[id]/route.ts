import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow, assertOrgCenters, assertOrgRoles } from '@/lib/db/scoped';
import { ApiError } from '@/lib/api/errors';
import { PERMISSIONS } from '@/lib/auth/roles';
import { updateUserSchema } from '@/lib/validation/users';

type Params = { id: string };

const SAFE_SELECT = {
  id: true, matricule: true, firstName: true, lastName: true, email: true,
  roles: true, status: true, avatarUrl: true,
  centers: { select: { id: true, name: true } },
} as const;

export const GET = withApiRoute<Params>(async (_req, { tx, orgId, userId, scope, params }) => {
  const user = await findOrgScopedOrThrow(() =>
    tx.user.findFirst({
      where: { id: params.id, organizationId: orgId, ...scope.user(userId) },
      select: { ...SAFE_SELECT, centers: { where: scope.center(), select: { id: true, name: true } } },
    })
  );
  return NextResponse.json(user);
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

export const PATCH = withApiRoute<Params>(async (req, { tx, orgId, userId, scope, params }) => {
  assertNotSelf(params.id, userId, 'modifier');
  const body = updateUserSchema.parse(await req.json());
  const user = await findOrgScopedOrThrow(() =>
    tx.user.findFirst({ where: { id: params.id, organizationId: orgId, ...scope.user(userId) } })
  );

  if (body.matricule !== undefined && body.matricule !== user.matricule) {
    throw new ApiError(400, 'Le matricule ne peut pas être modifié.', 'MATRICULE_IMMUTABLE');
  }

  // Vérification de l'auto-lockout (empêcher de retirer le dernier ADMIN)
  if (body.roles !== undefined && !body.roles.includes('ADMIN') && user.roles.includes('ADMIN')) {
    const adminCount = await tx.user.count({
      where: { organizationId: orgId, roles: { has: 'ADMIN' }, status: 'actif' },
    });
    if (adminCount <= 1) {
      throw new ApiError(403, 'Impossible de retirer le rôle ADMIN. Vous êtes le dernier administrateur actif.', 'LAST_ADMIN');
    }
  }

  // Empêcher la désactivation du dernier ADMIN
  if (body.status === 'inactif' && user.status === 'actif' && user.roles.includes('ADMIN')) {
    const adminCount = await tx.user.count({
      where: { organizationId: orgId, roles: { has: 'ADMIN' }, status: 'actif' },
    });
    if (adminCount <= 1) {
      throw new ApiError(403, 'Impossible de désactiver le dernier administrateur actif.', 'LAST_ADMIN');
    }
  }

  if (body.roles !== undefined) await assertOrgRoles(tx, orgId, body.roles);
  if (body.centerIds !== undefined) {
    await assertOrgCenters(tx, orgId, body.centerIds);
    scope.assertAssignableCenters(body.centerIds);
  }

  const { centerIds, matricule: _ignored, ...rest } = body;

  const updated = await tx.user.update({
    where: { id: user.id },
    data: {
      ...rest,
      ...(centerIds !== undefined ? { centers: { set: centerIds.map((id) => ({ id })) } } : {}),
    },
    select: SAFE_SELECT,
  });
  return NextResponse.json(updated);
}, { permission: { resource: 'users', action: 'write' } });

export const DELETE = withApiRoute<Params>(async (_req, { tx, orgId, userId, scope, params }) => {
  assertNotSelf(params.id, userId, 'supprimer');
  const user = await findOrgScopedOrThrow(() =>
    tx.user.findFirst({ where: { id: params.id, organizationId: orgId, ...scope.user(userId) } })
  );

  // Empêcher la suppression du dernier ADMIN
  if (user.roles.includes('ADMIN') && user.status === 'actif') {
    const adminCount = await tx.user.count({
      where: { organizationId: orgId, roles: { has: 'ADMIN' }, status: 'actif' },
    });
    if (adminCount <= 1) {
      throw new ApiError(403, 'Impossible de supprimer le dernier administrateur actif.', 'LAST_ADMIN');
    }
  }

  await tx.user.delete({ where: { id: user.id } });
  return NextResponse.json({ success: true });
}, { permission: { resource: 'users', action: 'write' } });
