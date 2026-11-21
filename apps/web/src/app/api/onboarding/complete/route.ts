export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { completeOnboardingSchema } from '@/lib/validation/onboarding';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import { users, organizations } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export const POST = withApiRoute(async (req, { tx, orgId, userId }) => {
  const body = completeOnboardingSchema.parse(await req.json().catch(() => ({})));
  const [userRow] = await tx.select({ email: users.email, firstName: users.firstName, lastName: users.lastName })
    .from(users).where(and(eq(users.id, userId), eq(users.organizationId, orgId))).limit(1);
  const user = await findOrgScopedOrThrow(async () => userRow);
  const [currentRow] = await tx.select({ onboardingStatus: organizations.onboardingStatus })
    .from(organizations).where(eq(organizations.id, orgId)).limit(1);
  const current = await findOrgScopedOrThrow(async () => currentRow);
  const firstCompletion = current.onboardingStatus !== 'termine';

  await tx.update(organizations).set({
    onboardingStatus: 'termine',
    onboardingStep: 'summary',
    onboardingSkippedSteps: body.skippedSteps,
    ...(firstCompletion ? { onboardingCompletedAt: new Date(), onboardingCompletedById: userId } : {}),
  }).where(eq(organizations.id, orgId));

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
