import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { ApiError } from '@/lib/api/errors';
import { changePasswordSchema } from '@/lib/validation/users';
import { postLoginRedirect, setAuthCookie } from '@/lib/auth/session';

/**
 * Changement de son propre mot de passe (Mon Profil, ou changement obligatoire d'un mot de passe
 * provisoire). Lève le drapeau mustChangePassword et réémet le cookie de session sans lui, ce
 * qui débloque l'accès à l'application (voir middleware.ts).
 */
export const POST = withApiRoute(async (req, { tx, orgId, userId }) => {
  const body = changePasswordSchema.parse(await req.json());
  const self = await findOrgScopedOrThrow(() =>
    tx.user.findFirst({ where: { id: userId, organizationId: orgId } })
  );

  const isCurrentValid = await bcrypt.compare(body.currentPassword, self.passwordHash);
  if (!isCurrentValid) {
    throw new ApiError(400, 'Mot de passe actuel incorrect.', 'INVALID_PASSWORD');
  }
  if (await bcrypt.compare(body.newPassword, self.passwordHash)) {
    throw new ApiError(400, "Le nouveau mot de passe doit être différent de l'actuel.", 'SAME_PASSWORD');
  }

  const passwordHash = await bcrypt.hash(body.newPassword, 10);
  await tx.user.update({ where: { id: self.id }, data: { passwordHash, mustChangePassword: false } });

  const redirectTo = await postLoginRedirect(tx, orgId, self.roles);
  const response = NextResponse.json({ success: true, redirectTo });
  await setAuthCookie(response, { userId: self.id, orgId, roles: self.roles });
  return response;
});
