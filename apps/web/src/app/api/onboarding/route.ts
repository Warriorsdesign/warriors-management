export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { findOrgScopedOrThrow } from '@/lib/db/scoped';
import { updateOnboardingSchema } from '@/lib/validation/onboarding';
import type { TenantClient } from '@/lib/db';
import { countActiveStudents } from '@/lib/business/studentQuota';
import { organizations, subscriptions, plans, centers, formations, classGroups, users, students } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';

async function loadOnboardingState(tx: TenantClient, orgId: string) {
  const [organization] = await tx.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
  const org = await findOrgScopedOrThrow(async () => organization);
  const [subscription] = await tx.select().from(subscriptions).where(eq(subscriptions.organizationId, orgId)).limit(1);
  const [plan] = subscription?.planId ? await tx.select().from(plans).where(eq(plans.id, subscription.planId)).limit(1) : [undefined];
  const [centersRow] = await tx.select({ value: count() }).from(centers).where(eq(centers.organizationId, orgId));
  const [formationsRow] = await tx.select({ value: count() }).from(formations).where(eq(formations.organizationId, orgId));
  const [classesRow] = await tx.select({ value: count() }).from(classGroups).where(eq(classGroups.organizationId, orgId));
  const [usersRow] = await tx.select({ value: count() }).from(users).where(eq(users.organizationId, orgId));
  const [studentsRow] = await tx.select({ value: count() }).from(students).where(eq(students.organizationId, orgId));
  const activeStudents = await countActiveStudents(tx, orgId);
  return {
    organizationName: org.name,
    status: org.onboardingStatus,
    step: org.onboardingStep,
    skippedSteps: org.onboardingSkippedSteps,
    completedAt: org.onboardingCompletedAt,
    counts: { centers: Number(centersRow.value), formations: Number(formationsRow.value), classes: Number(classesRow.value), users: Number(usersRow.value), students: Number(studentsRow.value), activeStudents },
    limits: subscription ? { planName: plan?.name ?? 'Essai', maxCenters: subscription.maxCenters, maxStudents: subscription.maxStudents } : null,
  };
}

export const GET = withApiRoute(async (_req, { tx, orgId }) => NextResponse.json(await loadOnboardingState(tx, orgId)), { permission: { resource: 'organization', action: 'write' } });

export const PATCH = withApiRoute(async (req, { tx, orgId }) => {
  const body = updateOnboardingSchema.parse(await req.json());
  const [currentRow] = await tx.select({ onboardingStatus: organizations.onboardingStatus }).from(organizations).where(eq(organizations.id, orgId)).limit(1);
  const current = await findOrgScopedOrThrow(async () => currentRow);
  await tx.update(organizations).set({
    ...(body.step !== undefined ? { onboardingStep: body.step } : {}),
    ...(body.skippedSteps !== undefined ? { onboardingSkippedSteps: body.skippedSteps } : {}),
    ...(current.onboardingStatus === 'non_commence' ? { onboardingStatus: 'en_cours' } : {}),
  }).where(eq(organizations.id, orgId));
  return NextResponse.json(await loadOnboardingState(tx, orgId));
}, { permission: { resource: 'organization', action: 'write' } });
