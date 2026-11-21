import bcrypt from 'bcryptjs';
import { and, count, eq, gte, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { auditLogs, plans, subscriptions, users, organizations } from '@/lib/db/schema';
import { ApiError } from '@/lib/api/errors';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import { ensureOrgSystemRoles } from '@/lib/auth/permissions';
import { generateUserMatricule } from '@/lib/business/matricule';
import { TRIAL_DAYS } from '@/lib/config/contact';
import type { SignupInput } from '@/lib/validation/signup';

/** Inscriptions acceptées par adresse IP et par heure (protection contre les créations en masse). */
const MAX_SIGNUPS_PER_IP_PER_HOUR = 3;

export async function assertSignupRateLimit(ip: string): Promise<void> {
  if (!ip) return;
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const [recent] = await db.select({ count: count() }).from(auditLogs).where(and(
    eq(auditLogs.action, 'ORGANIZATION_SIGNUP'),
    gte(auditLogs.createdAt, since),
    sql`${auditLogs.details}->>'ip' = ${ip}`,
  ));
  if ((recent?.count ?? 0) >= MAX_SIGNUPS_PER_IP_PER_HOUR) {
    throw new ApiError(429, 'Trop de créations de compte depuis cette connexion. Réessayez dans une heure.', 'SIGNUP_RATE_LIMIT');
  }
}

/**
 * Crée en une transaction l'organisation, son essai gratuit (forfait gratuit, TRIAL_DAYS jours,
 * limites du forfait), ses rôles système et son premier administrateur. À la fin de l'essai,
 * l'accès est coupé tant qu'aucun forfait n'est choisi (voir lib/business/subscriptionAccess.ts).
 */
export async function createTrialOrganization(input: SignupInput, ip: string) {
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
  if (existing) {
    throw new ApiError(409, 'Un compte existe déjà avec cette adresse email. Connectez-vous ou utilisez une autre adresse.', 'EMAIL_TAKEN');
  }

  const [plan] = await db.select().from(plans).where(eq(plans.price, 0)).orderBy(plans.createdAt).limit(1);
  if (!plan) {
    throw new ApiError(503, "L'essai gratuit n'est pas disponible pour le moment. Contactez-nous.", 'TRIAL_PLAN_MISSING');
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const matricule = await generateUserMatricule(input.organizationName);
  const endDate = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const { org, user } = await db.transaction(async (tx) => {
    const [org] = await tx.insert(organizations).values({
      name: input.organizationName, email: input.email, phone: input.phone, status: 'actif',
    }).returning();
    if (!org) throw new Error('Organization creation failed');
    await ensureOrgSystemRoles(tx, org.id);
    await tx.insert(subscriptions).values({
        organizationId: org.id,
        planId: plan.id,
        status: 'trial',
        startDate: new Date(),
        endDate,
        maxCenters: plan.isUnlimitedCenters ? -1 : plan.maxCenters,
        maxStudents: plan.isUnlimitedStudents ? -1 : plan.maxStudents,
    });
    const [user] = await tx.insert(users).values({
        organizationId: org.id,
        matricule,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        passwordHash,
        mustChangePassword: false, // mot de passe choisi par l'utilisateur lui-même
        roles: ['ADMIN'],
        status: 'actif',
        lastLoginAt: new Date(),
      }).returning();
    if (!user) throw new Error('User creation failed');
    return { org, user };
  });

  await logAuditEvent({
    actorId: user.id,
    actorEmail: user.email,
    actorName: `${user.firstName} ${user.lastName}`,
    action: 'ORGANIZATION_SIGNUP',
    resource: 'Organization',
    resourceId: org.id,
    details: { ip, name: org.name, phone: input.phone, plan: plan.name, trialEndsAt: endDate.toISOString() },
  });

  return { org, user, trialEndsAt: endDate };
}
