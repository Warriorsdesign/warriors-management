import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { ApiError } from '@/lib/api/errors';
import { PERMISSIONS } from '@/lib/auth/roles';
import { updateUserSchema } from '@/lib/validation/users';

type Params = { id: string };

const SAFE_SELECT = {
  id: true, matricule: true, firstName: true, lastName: true, email: true,
  roles: true, status: true, avatarUrl: true,
  centers: { select: { id: true, name: true } },
} as const;

export const GET = withApiRoute<Params>(async (_req, { tx, orgId, params }) => {
  const user = await findOrgScopedOrThrow(() =>
    tx.user.findFirst({ where: { id: params.id, organizationId: orgId }, select: SAFE_SELECT })
  );
  return NextResponse.json(user);
}, { allowedRoles: PERMISSIONS.users.read });

export const PATCH = withApiRoute<Params>(async (req, { tx, orgId, params }) => {
  const body = updateUserSchema.parse(await req.json());
  const user = await findOrgScopedOrThrow(() =>
    tx.user.findFirst({ where: { id: params.id, organizationId: orgId } })
  );

  if (body.matricule !== undefined && body.matricule !== user.matricule) {
    throw new ApiError(400, 'Le matricule ne peut pas être modifié.', 'MATRICULE_IMMUTABLE');
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
}, { allowedRoles: PERMISSIONS.users.write });

export const DELETE = withApiRoute<Params>(async (_req, { tx, orgId, params }) => {
  const user = await findOrgScopedOrThrow(() =>
    tx.user.findFirst({ where: { id: params.id, organizationId: orgId } })
  );
  await tx.user.delete({ where: { id: user.id } });
  return NextResponse.json({ success: true });
}, { allowedRoles: PERMISSIONS.users.write });
