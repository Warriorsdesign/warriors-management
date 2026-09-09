import { ApiError } from '@/lib/api/errors';
import type { TenantClient } from '@/lib/db';

export interface Level {
  id: string;
  name: string;
}

/**
 * Régénère la liste des niveaux pour matcher levelCount, en préservant les ids/noms
 * des niveaux existants (lvl_N) et en tronquant/complétant le reste. Port exact de
 * la logique de formations/page.tsx.
 */
export function regenerateLevels(existing: Level[] | null | undefined, levelCount: number): Level[] {
  const levels: Level[] = [];
  for (let i = 1; i <= levelCount; i++) {
    const id = `lvl_${i}`;
    const found = existing?.find((l) => l.id === id);
    levels.push(found ?? { id, name: `Niveau ${i}` });
  }
  return levels;
}

/**
 * Bloque réellement la suppression d'une formation référencée par des classes
 * (l'ancienne UI se contentait d'avertir sans empêcher) : un cascade delete
 * effacerait silencieusement l'historique de paiement de tous les étudiants
 * inscrits dans ces classes.
 */
export async function assertFormationDeletable(tx: TenantClient, formationId: string): Promise<void> {
  const count = await tx.classGroup.count({ where: { formationId } });
  if (count > 0) {
    throw new ApiError(
      409,
      'Cette formation est référencée par des classes existantes et ne peut pas être supprimée.',
      'FORMATION_HAS_CLASSES'
    );
  }
}
