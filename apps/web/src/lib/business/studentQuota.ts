import type { TenantClient } from '@/lib/db';
import { ApiError } from '@/lib/api/errors';
import { CONTACT } from '@/lib/config/contact';
import { INACTIVE_STATUSES } from './classStatus';

/**
 * Quota d'étudiants du forfait : seuls les étudiants actifs comptent (comme pour la capacité des
 * classes). Un abandon ou une formation terminée libère sa place, l'historique reste conservé.
 */
export function countActiveStudents(tx: TenantClient, orgId: string): Promise<number> {
  return tx.student.count({ where: { organizationId: orgId, currentStatus: { notIn: INACTIVE_STATUSES } } });
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
  const sub = await tx.subscription.findUnique({ where: { organizationId: orgId }, select: { maxStudents: true, plan: { select: { name: true } } } });
  if (!sub) throw new ApiError(400, 'Abonnement introuvable.', 'SUBSCRIPTION_NOT_FOUND');
  if (sub.maxStudents === -1) return;
  const active = await countActiveStudents(tx, orgId);
  if (active + adding > sub.maxStudents) {
    throw new ApiError(403, quotaMessage(sub.plan?.name, sub.maxStudents), 'QUOTA_EXCEEDED');
  }
}
