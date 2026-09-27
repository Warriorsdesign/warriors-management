import { ApiError } from '@/lib/api/errors';
import type { TenantClient } from '@/lib/db';
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
  const count = await tx.classGroup.count({ where: { formationId } });
  if (count > 0) {
    throw new ApiError(
      409,
      'Cette formation est référencée par des classes existantes et ne peut pas être supprimée.',
      'FORMATION_HAS_CLASSES'
    );
  }
}

/** Une formation est "partagée" quand elle est proposée dans au moins deux centres. */
export async function isFormationShared(tx: TenantClient, formationId: string): Promise<boolean> {
  const formation = await tx.formation.findUnique({
    where: { id: formationId },
    select: { _count: { select: { centers: true } } },
  });
  return (formation?._count.centers ?? 0) > 1;
}

/**
 * Champs renvoyés pour une formation : ses centres (limités au périmètre de l'utilisateur, pour
 * ne pas révéler les autres) et leur nombre total, qui sert à calculer sharedAcrossCenters.
 */
export function formationInclude(scope: CenterScope) {
  return {
    centers: { where: scope.center(), select: { id: true, name: true }, orderBy: { name: 'asc' as const } },
    _count: { select: { centers: true } },
  };
}

export function toFormationDTO<T extends { _count: { centers: number } }>({ _count, ...formation }: T) {
  return { ...formation, sharedAcrossCenters: _count.centers > 1 };
}

/**
 * Retirer un centre d'une formation est refusé tant que des classes de cette formation y
 * existent : elles deviendraient incohérentes (classe d'une formation non proposée dans son centre).
 */
export async function assertCentersKeepClasses(tx: TenantClient, formationId: string, centerIds: string[]): Promise<void> {
  const orphan = await tx.classGroup.findFirst({
    where: { formationId, centerId: { notIn: centerIds } },
    select: { center: { select: { name: true } } },
  });
  if (orphan) {
    throw new ApiError(
      409,
      `Impossible de retirer le centre "${orphan.center.name}" : des classes de cette formation y sont ouvertes.`,
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
