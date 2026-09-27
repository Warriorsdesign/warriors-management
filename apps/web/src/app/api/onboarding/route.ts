import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { updateOnboardingSchema } from '@/lib/validation/onboarding';
import type { TenantClient } from '@/lib/db';

/** État de l'assistant + compteurs réels (source de vérité pour la reprise et le récapitulatif). */
async function loadOnboardingState(tx: TenantClient, orgId: string) {
  const organization = await findOrgScopedOrThrow(() =>
    tx.organization.findFirst({
      where: { id: orgId },
      select: {
        name: true,
        onboardingStatus: true,
        onboardingStep: true,
        onboardingSkippedSteps: true,
        onboardingCompletedAt: true,
        subscription: {
          select: { maxCenters: true, maxStudents: true, status: true, endDate: true, plan: { select: { name: true } } },
        },
      },
    })
  );

  const [centers, formations, classes, users, students] = await Promise.all([
    tx.center.count({ where: { organizationId: orgId } }),
    tx.formation.count({ where: { organizationId: orgId } }),
    tx.classGroup.count({ where: { organizationId: orgId } }),
    tx.user.count({ where: { organizationId: orgId } }),
    tx.student.count({ where: { organizationId: orgId } }),
  ]);

  const sub = organization.subscription;
  return {
    organizationName: organization.name,
    status: organization.onboardingStatus,
    step: organization.onboardingStep,
    skippedSteps: organization.onboardingSkippedSteps,
    completedAt: organization.onboardingCompletedAt,
    counts: { centers, formations, classes, users, students },
    limits: sub
      ? { planName: sub.plan?.name ?? 'Essai', maxCenters: sub.maxCenters, maxStudents: sub.maxStudents }
      : null,
  };
}

export const GET = withApiRoute(async (_req, { tx, orgId }) => {
  return NextResponse.json(await loadOnboardingState(tx, orgId));
}, { permission: { resource: 'organization', action: 'write' } });

/**
 * Sauvegarde la progression (étape courante, étapes ignorées). Passe l'assistant à "en_cours"
 * au premier enregistrement ; ne le termine jamais (voir /api/onboarding/complete). Une
 * organisation déjà configurée qui revisite l'assistant depuis les paramètres reste "termine".
 */
export const PATCH = withApiRoute(async (req, { tx, orgId }) => {
  const body = updateOnboardingSchema.parse(await req.json());
  const current = await findOrgScopedOrThrow(() =>
    tx.organization.findFirst({ where: { id: orgId }, select: { onboardingStatus: true } })
  );

  await tx.organization.update({
    where: { id: orgId },
    data: {
      ...(body.step !== undefined ? { onboardingStep: body.step } : {}),
      ...(body.skippedSteps !== undefined ? { onboardingSkippedSteps: body.skippedSteps } : {}),
      ...(current.onboardingStatus === 'non_commence' ? { onboardingStatus: 'en_cours' } : {}),
    },
  });

  return NextResponse.json(await loadOnboardingState(tx, orgId));
}, { permission: { resource: 'organization', action: 'write' } });
