import { ApiError } from '@/lib/api/errors';
import { and, count, eq, notInArray } from 'drizzle-orm';
import type { TenantClient } from '@/lib/db-types';
import { centers, classGroups, formationCenters } from '@/lib/db/schema';
import type { CenterScope } from '@/lib/auth/centerScope';

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
  const [result] = await tx.select({ count: count() }).from(classGroups)
    .where(eq(classGroups.formationId, formationId));
  if ((result?.count ?? 0) > 0) {
    throw new ApiError(
      409,
      'Cette formation est référencée par des classes existantes et ne peut pas être supprimée.',
      'FORMATION_HAS_CLASSES'
    );
  }
}

/** Une formation est "partagée" quand elle est proposée dans au moins deux centres. */
export async function isFormationShared(tx: TenantClient, formationId: string): Promise<boolean> {
  const [result] = await tx.select({ count: count() }).from(formationCenters)
    .where(eq(formationCenters.formationId, formationId));
  return (result?.count ?? 0) > 1;
}

export function toFormationDTO<T extends { centerCount: number }>(formation: T) {
  const { centerCount, ...data } = formation;
  return { ...data, sharedAcrossCenters: centerCount > 1 };
}

/**
 * Retirer un centre d'une formation est refusé tant que des classes de cette formation y
 * existent : elles deviendraient incohérentes (classe d'une formation non proposée dans son centre).
 */
export async function assertCentersKeepClasses(tx: TenantClient, formationId: string, centerIds: string[]): Promise<void> {
  const [orphan] = await tx.select({ name: centers.name }).from(classGroups)
    .innerJoin(centers, eq(centers.id, classGroups.centerId))
    .where(and(
      eq(classGroups.formationId, formationId),
      ...(centerIds.length ? [notInArray(classGroups.centerId, centerIds)] : []),
    )).limit(1);
  if (orphan) {
    throw new ApiError(
      409,
      `Impossible de retirer le centre "${orphan.name}" : des classes de cette formation y sont ouvertes.`,
      'FORMATION_CENTER_HAS_CLASSES'
    );
  }
}

/**
 * Modifier ou supprimer une formation partagée entre plusieurs centres affecte les autres
 * centres (coût, niveaux, échéanciers) : réservé aux administrateurs de l'organisation.
 */
export async function assertFormationEditable(tx: TenantClient, formationId: string, scope: CenterScope): Promise<void> {
  if (scope.isAdmin) return;
  if (await isFormationShared(tx, formationId)) {
    throw new ApiError(
      403,
      'Cette formation est enseignée dans plusieurs centres : seul un administrateur peut la modifier ou la supprimer.',
      'SHARED_FORMATION_ADMIN_ONLY'
    );
  }
}
