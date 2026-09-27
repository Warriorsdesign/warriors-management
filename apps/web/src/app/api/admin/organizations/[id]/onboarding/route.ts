import { NextResponse } from 'next/server';
import { withAdminRoute } from '@/lib/api/admin-handler';
import { ApiError } from '@/lib/api/errors';
import { logAuditEvent } from '@/lib/audit/audit-logger';

/**
 * Relance l'assistant de configuration d'une organisation : il sera reproposé à ses
 * administrateurs à leur prochaine connexion. Ne supprime aucune donnée - les éléments
 * déjà créés restent visibles dans chaque étape.
 */
export const POST = withAdminRoute<{ id: string }>(async (_req, { prisma, adminUser, params }) => {
  const organization = await prisma.organization.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, onboardingStatus: true },
  });
  if (!organization) throw new ApiError(404, 'Organisation non trouvée.', 'NOT_FOUND');

  await prisma.organization.update({
    where: { id: organization.id },
    data: {
      onboardingStatus: 'non_commence',
      onboardingStep: null,
      onboardingSkippedSteps: [],
      onboardingCompletedAt: null,
      onboardingCompletedById: null,
    },
  });

  await logAuditEvent({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    actorName: 'Super Admin',
    action: 'ONBOARDING_RESET',
    resource: 'Organization',
    resourceId: organization.id,
    details: { name: organization.name, previousStatus: organization.onboardingStatus },
  });

  return NextResponse.json({ success: true });
});
