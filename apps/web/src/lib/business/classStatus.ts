import type { TenantClient } from '@/lib/db';
import { ApiError } from '@/lib/api/errors';

export type ClassStatus = 'ouverte' | 'complete' | 'cloturee';

/** Port exact de getComputedClassStatus (mockData.ts) : cloturee (manuel) gagne toujours. */
export function computeClassStatus(
  manualStatus: string,
  capacity: number,
  enrolledCount: number
): ClassStatus {
  if (manualStatus === 'cloturee') return 'cloturee';
  return enrolledCount >= capacity ? 'complete' : 'ouverte';
}

/** Statuts qui libèrent la place de l'étudiant dans sa classe (abandon, formation terminée). */
export const INACTIVE_STATUSES = ['formation_terminee', 'abandonne'];

export function isActiveStatus(status: string): boolean {
  return !INACTIVE_STATUSES.includes(status);
}

/** Port exact de getActiveStudentsForClass (mockData.ts). */
export async function getActiveStudentsForClass(tx: TenantClient, classId: string, excludeStudentId?: string): Promise<number> {
  return tx.student.count({
    where: { classId, currentStatus: { notIn: INACTIVE_STATUSES }, ...(excludeStudentId ? { id: { not: excludeStudentId } } : {}) },
  });
}

/**
 * Règle unique pour occuper une place dans une classe (inscription, changement de classe,
 * retour d'un étudiant abandonné) : la classe ne doit pas être clôturée, et seuls les étudiants
 * actifs comptent dans la capacité. Un abandon libère donc sa place, comme à l'affichage.
 */
export async function assertClassHasRoom(
  tx: TenantClient,
  classGroup: { id: string; name: string; capacity: number; status: string },
  excludeStudentId?: string
): Promise<void> {
  if (classGroup.status === 'cloturee') {
    throw new ApiError(409, `La classe « ${classGroup.name} » est clôturée : elle n'accepte plus d'étudiants.`, 'CLASS_CLOSED');
  }
  const active = await getActiveStudentsForClass(tx, classGroup.id, excludeStudentId);
  if (active >= classGroup.capacity) {
    throw new ApiError(409, `La classe « ${classGroup.name} » est complète (${classGroup.capacity} places occupées par des étudiants actifs).`, 'CLASS_FULL');
  }
}
