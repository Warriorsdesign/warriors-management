import type { TenantClient } from '@/lib/db';

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

const INACTIVE_STATUSES = ['formation_terminee', 'abandonne'];

/** Port exact de getActiveStudentsForClass (mockData.ts). */
export async function getActiveStudentsForClass(tx: TenantClient, classId: string): Promise<number> {
  return tx.student.count({
    where: { classId, currentStatus: { notIn: INACTIVE_STATUSES } },
  });
}
