import type { Prisma } from '@prisma/client';
import type { TenantClient } from '@/lib/db';
import { ApiError } from '@/lib/api/errors';
import { ROLES } from './roles';

/** Identifiant impossible : filtre "aucun centre" quand l'utilisateur demande un centre hors périmètre. */
const NO_CENTER = '__aucun_centre__';

/**
 * Périmètre de centres d'un utilisateur, calculé côté serveur à chaque requête (et non stocké
 * dans le JWT : un changement d'affectation s'applique immédiatement).
 *
 * - ADMIN : toute l'organisation.
 * - Autre rôle affecté à un ou plusieurs centres : uniquement ces centres. Toutes les données
 *   rattachées à un autre centre (classes, étudiants, paiements, dépenses, formations
 *   enseignées uniquement ailleurs, utilisateurs) lui sont invisibles, y compris dans les filtres.
 * - Autre rôle sans aucun centre affecté : toute l'organisation ("Tous les centres" dans l'UI).
 *
 * L'appartenance à l'organisation reste garantie en amont (filtres organizationId + RLS) ;
 * ce périmètre s'y ajoute, il ne le remplace jamais.
 */
export class CenterScope {
  constructor(
    readonly centerIds: string[] | null,
    /** Rôle ADMIN (lu en base) : certaines actions à portée multi-centres lui sont réservées. */
    readonly isAdmin = false
  ) {}

  get isRestricted(): boolean {
    return this.centerIds !== null;
  }

  allows(centerId: string): boolean {
    return this.centerIds === null || this.centerIds.includes(centerId);
  }

  /** Lève une 404 (et non 403) pour ne pas révéler l'existence d'un centre hors périmètre. */
  assertCenter(centerId: string, message = 'Centre introuvable.'): void {
    if (!this.allows(centerId)) throw new ApiError(404, message, 'NOT_FOUND');
  }

  /**
   * Centres effectivement filtrés, à partir du filtre demandé par l'interface (?centerId=...) :
   * une demande vide = tout le périmètre ; une demande hors périmètre ne renvoie rien.
   * Retourne [] quand aucune restriction ne s'applique (convention de centerFilter.ts).
   */
  effective(requested: string[]): string[] {
    if (this.centerIds === null) return requested;
    if (requested.length === 0) return this.centerIds;
    const allowed = requested.filter((id) => this.centerIds!.includes(id));
    return allowed.length > 0 ? allowed : [NO_CENTER];
  }

  private get ids(): string[] {
    return this.centerIds ?? [];
  }

  /**
   * Chaque condition de périmètre est enveloppée dans AND : étalée (`...scope.center()`) dans
   * une clause where qui contient déjà la même clé (ex : `id: params.id`), elle l'écraserait
   * silencieusement au lieu de s'y ajouter. Une clause where ne doit étaler qu'UN seul helper.
   */
  private and<T>(condition: T): { AND: T[] } | Record<string, never> {
    return this.isRestricted ? { AND: [condition] } : {};
  }

  center(): Prisma.CenterWhereInput {
    return this.and<Prisma.CenterWhereInput>({ id: { in: this.ids } });
  }

  classGroup(): Prisma.ClassGroupWhereInput {
    return this.and<Prisma.ClassGroupWhereInput>({ centerId: { in: this.ids } });
  }

  student(): Prisma.StudentWhereInput {
    return this.and<Prisma.StudentWhereInput>({ classGroup: { centerId: { in: this.ids } } });
  }

  payment(): Prisma.PaymentWhereInput {
    return this.and<Prisma.PaymentWhereInput>({ student: { classGroup: { centerId: { in: this.ids } } } });
  }

  expense(): Prisma.ExpenseWhereInput {
    return this.and<Prisma.ExpenseWhereInput>({ centerId: { in: this.ids } });
  }

  /** Formations proposées dans au moins un centre du périmètre (relation Formation.centers). */
  formation(): Prisma.FormationWhereInput {
    return this.and<Prisma.FormationWhereInput>({ centers: { some: { id: { in: this.ids } } } });
  }

  /** Utilisateurs partageant au moins un centre du périmètre (et soi-même). */
  user(selfId: string): Prisma.UserWhereInput {
    return this.and<Prisma.UserWhereInput>({ OR: [{ centers: { some: { id: { in: this.ids } } } }, { id: selfId }] });
  }

  /**
   * Centres qu'un utilisateur restreint peut affecter à un compte : uniquement les siens, et au
   * moins un (un compte sans centre voit toute l'organisation : ce serait élargir son propre accès).
   */
  assertAssignableCenters(centerIds: string[]): void {
    if (!this.isRestricted) return;
    if (centerIds.length === 0) {
      throw new ApiError(403, 'Vous devez affecter au moins un de vos centres à cet utilisateur.', 'CENTER_REQUIRED');
    }
    centerIds.forEach((id) => this.assertCenter(id));
  }
}

/**
 * Lit rôles et affectations en base (les rôles du JWT restent figés jusqu'à la reconnexion :
 * un administrateur qui retire le rôle ADMIN ou change les centres doit prendre effet tout de suite).
 */
export async function loadCenterScope(tx: TenantClient, orgId: string, userId: string): Promise<CenterScope> {
  const user = await tx.user.findFirst({
    where: { id: userId, organizationId: orgId },
    select: { roles: true, centers: { where: { organizationId: orgId }, select: { id: true } } },
  });
  if (!user) throw new ApiError(401, 'Unauthorized', 'USER_NOT_FOUND');
  if (user.roles.includes(ROLES.ADMIN)) return new CenterScope(null, true);
  const ids = user.centers.map((c) => c.id);
  return new CenterScope(ids.length > 0 ? ids : null);
}
