import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';

export const GET = withApiRoute(async (_req, { tx, orgId, userId, perms }) => {
  const user = await findOrgScopedOrThrow(() =>
    tx.user.findFirst({
      where: { id: userId, organizationId: orgId },
      include: { centers: { select: { id: true, name: true } } },
    })
  );
  const organization = await findOrgScopedOrThrow(() =>
    tx.organization.findFirst({ where: { id: orgId } })
  );

  return NextResponse.json({
    user: {
      id: user.id,
      matricule: user.matricule,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roles: user.roles,
      status: user.status,
      avatarUrl: user.avatarUrl,
      centers: user.centers,
    },
    // Permissions effectives : pilotent le menu et l'affichage (le serveur reste la barrière).
    permissions: perms.grants,
    organization: {
      id: organization.id,
      name: organization.name,
      logoUrl: organization.logoUrl,
      email: organization.email,
      phone: organization.phone,
      address: organization.address,
      onboardingStatus: organization.onboardingStatus,
      onboardingStep: organization.onboardingStep,
    },
  });
});
