import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { ApiError } from '@/lib/api/errors';
import { changePasswordSchema } from '@/lib/validation/users';

export const POST = withApiRoute(async (req, { tx, orgId, userId }) => {
  const body = changePasswordSchema.parse(await req.json());
  const self = await findOrgScopedOrThrow(() =>
    tx.user.findFirst({ where: { id: userId, organizationId: orgId } })
  );

  const isCurrentValid = await bcrypt.compare(body.currentPassword, self.passwordHash);
  if (!isCurrentValid) {
    throw new ApiError(400, 'Mot de passe actuel incorrect.', 'INVALID_PASSWORD');
  }

  const passwordHash = await bcrypt.hash(body.newPassword, 10);
  await tx.user.update({ where: { id: self.id }, data: { passwordHash } });

  return NextResponse.json({ success: true });
});
