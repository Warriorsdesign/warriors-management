import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { updateOwnProfileSchema } from '@/lib/validation/users';

export const PATCH = withApiRoute(async (req, { tx, orgId, userId }) => {
  const body = updateOwnProfileSchema.parse(await req.json());
  const self = await findOrgScopedOrThrow(() =>
    tx.user.findFirst({ where: { id: userId, organizationId: orgId } })
  );
  const updated = await tx.user.update({
    where: { id: self.id },
    data: body,
    select: {
      id: true, matricule: true, firstName: true, lastName: true, email: true,
      roles: true, status: true, avatarUrl: true,
    },
  });
  return NextResponse.json(updated);
});
