export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { users, organizations, centerUsers, centers } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export const GET = withApiRoute(async (_req, { tx, orgId, userId, perms }) => {
  const [userRow] = await tx.select().from(users).where(and(eq(users.id, userId), eq(users.organizationId, orgId))).limit(1);
  const user = await findOrgScopedOrThrow(async () => userRow);
  const userCenters = await tx.select({ id: centers.id, name: centers.name }).from(centerUsers)
    .innerJoin(centers, eq(centers.id, centerUsers.centerId))
    .where(and(eq(centerUsers.userId, userId), eq(centers.organizationId, orgId)));
  const [organization] = await tx.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
  const org = await findOrgScopedOrThrow(async () => organization);

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
      centers: userCenters,
    },
    // Permissions effectives : pilotent le menu et l'affichage (le serveur reste la barrière).
    permissions: perms.grants,
    organization: {
      id: org.id,
      name: organization.name,
      logoUrl: org.logoUrl,
      email: org.email,
      phone: org.phone,
      address: org.address,
      themeColor: org.themeColor,
      onboardingStatus: org.onboardingStatus,
      onboardingStep: org.onboardingStep,
    },
  });
});
