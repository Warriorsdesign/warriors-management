import type { TenantClient } from '@/lib/db';
import { ApiError } from '@/lib/api/errors';
import { assertClassHasRoom, isActiveStatus } from './classStatus';

/**
 * Changement de classe d'un étudiant existant. La classe cible doit appartenir à la même
 * formation : l'échéancier et les niveaux de l'étudiant sont calculés sur sa formation, un
 * changement de formation fausserait ses finances. Un étudiant actif doit trouver une place libre.
 */
export async function assertCanMoveToClass(
  tx: TenantClient,
  student: { id: string; classId: string; currentStatus: string },
  target: { id: string; name: string; capacity: number; status: string; formationId: string }
): Promise<void> {
  const current = await tx.classGroup.findUnique({ where: { id: student.classId }, select: { formationId: true } });
  if (current && current.formationId !== target.formationId) {
    throw new ApiError(
      409,
      "Changement de formation impossible : l'échéancier de l'étudiant dépend de sa formation. Choisissez une classe de la même formation.",
      'FORMATION_CHANGE_FORBIDDEN'
    );
  }
  if (isActiveStatus(student.currentStatus)) await assertClassHasRoom(tx, target, student.id);
  else if (target.status === 'cloturee') await assertClassHasRoom(tx, target, student.id);
}
