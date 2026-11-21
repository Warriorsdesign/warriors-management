import { and, eq, notInArray, sql } from 'drizzle-orm';
import type { TenantClient } from '@/lib/db-types';
import { plans, students, subscriptions } from '@/lib/db/schema';
import { ApiError } from '@/lib/api/errors';
import { CONTACT } from '@/lib/config/contact';
import { INACTIVE_STATUSES } from './classStatus';

/**
 * Quota d'étudiants du forfait : seuls les étudiants actifs comptent (comme pour la capacité des
 * classes). Un abandon ou une formation terminée libère sa place, l'historique reste conservé.
 */
export function countActiveStudents(tx: TenantClient, orgId: string): Promise<number> {
  return tx.select({ count: sql<number>`count(*)::int` }).from(students)
    .where(and(eq(students.organizationId, orgId), notInArray(students.currentStatus, INACTIVE_STATUSES)))
    .then(([row]) => row?.count ?? 0);
}

export function quotaMessage(planName: string | null | undefined, maxStudents: number, detail = ''): string {
  return (
    `Quota atteint. Votre forfait ${planName || 'Essai'} est limité à ${maxStudents} étudiant(s) actif(s)${detail}. ` +
    `Les étudiants qui ont abandonné ou terminé leur formation ne comptent pas. ` +
    `Pour passer à un forfait supérieur, contactez-nous : ${CONTACT.email} ou WhatsApp ${CONTACT.whatsappDisplay}.`
  );
}

/** Vérifie qu'on peut ajouter `adding` étudiants actifs (inscription, retour d'un étudiant inactif). */
export async function assertStudentQuota(tx: TenantClient, orgId: string, adding = 1): Promise<void> {
  const [sub] = await tx.select({
    maxStudents: subscriptions.maxStudents,
    planName: plans.name,
  }).from(subscriptions).leftJoin(plans, eq(plans.id, subscriptions.planId))
    .where(eq(subscriptions.organizationId, orgId)).limit(1);
  if (!sub) throw new ApiError(400, 'Abonnement introuvable.', 'SUBSCRIPTION_NOT_FOUND');
  if (sub.maxStudents === -1) return;
  const active = await countActiveStudents(tx, orgId);
  if (active + adding > sub.maxStudents) {
    throw new ApiError(403, quotaMessage(sub.planName, sub.maxStudents), 'QUOTA_EXCEEDED');
  }
}
