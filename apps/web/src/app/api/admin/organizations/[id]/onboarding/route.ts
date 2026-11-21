import { NextResponse } from 'next/server';
import { withAdminRoute } from '@/lib/api/admin-handler';
import { ApiError } from '@/lib/api/errors';
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logAuditEvent } from '@/lib/audit/audit-logger';

/**
 * Relance l'assistant de configuration d'une organisation : il sera reproposé à ses
 * administrateurs à leur prochaine connexion. Ne supprime aucune donnée - les éléments
 * déjà créés restent visibles dans chaque étape.
 */
export const POST = withAdminRoute<{ id: string }>(async (_req, { adminUser, params }) => {
  const [organization] = await db.select({ id: organizations.id, name: organizations.name, onboardingStatus: organizations.onboardingStatus }).from(organizations).where(eq(organizations.id, params.id)).limit(1);
  if (!organization) throw new ApiError(404, 'Organisation non trouvée.', 'NOT_FOUND');

  await db.update(organizations).set({
      onboardingStatus: 'non_commence',
      onboardingStep: null,
      onboardingSkippedSteps: [],
      onboardingCompletedAt: null,
      onboardingCompletedById: null,
  }).where(eq(organizations.id, organization.id));

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
