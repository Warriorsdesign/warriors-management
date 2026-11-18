import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { completeOnboardingSchema } from '@/lib/validation/onboarding';
import { logAuditEvent } from '@/lib/audit/audit-logger';

/**
 * Termine l'assistant (fin normale du parcours ou "Passer la configuration"). Idempotent :
 * rappeler la route après une revisite depuis les paramètres ne fait que mettre à jour
 * les étapes ignorées.
 */
export const POST = withApiRoute(async (req, { tx, orgId, userId }) => {
  const body = completeOnboardingSchema.parse(await req.json().catch(() => ({})));
  const user = await findOrgScopedOrThrow(() =>
    tx.user.findFirst({
      where: { id: userId, organizationId: orgId },
      select: { email: true, firstName: true, lastName: true },
    })
  );
  const current = await findOrgScopedOrThrow(() =>
    tx.organization.findFirst({ where: { id: orgId }, select: { onboardingStatus: true } })
  );
  const firstCompletion = current.onboardingStatus !== 'termine';

  await tx.organization.update({
    where: { id: orgId },
    data: {
      onboardingStatus: 'termine',
      onboardingStep: 'summary',
      onboardingSkippedSteps: body.skippedSteps,
      ...(firstCompletion ? { onboardingCompletedAt: new Date(), onboardingCompletedById: userId } : {}),
    },
  });

  if (firstCompletion) {
    await logAuditEvent({
      actorId: userId,
      actorEmail: user.email,
      actorName: `${user.firstName} ${user.lastName}`,
      action: 'ONBOARDING_COMPLETED',
      resource: 'Organization',
      resourceId: orgId,
      details: { skippedSteps: body.skippedSteps },
    });
  }

  return NextResponse.json({ success: true });
}, { permission: { resource: 'organization', action: 'write' } });
