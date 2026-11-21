import { and, eq } from 'drizzle-orm';
import type { TenantClient } from '@/lib/db-types';
import { centerUsers, centers, users } from '@/lib/db/schema';
import { ApiError } from '@/lib/api/errors';
import { ROLES } from './roles';

const NO_CENTER = '__aucun_centre__';

export class CenterScope {
  constructor(
    readonly centerIds: string[] | null,
    readonly isAdmin = false
  ) {}

  get isRestricted(): boolean {
    return this.centerIds !== null;
  }

  allows(centerId: string): boolean {
    return this.centerIds === null || this.centerIds.includes(centerId);
  }

  assertCenter(centerId: string, message = 'Centre introuvable.'): void {
    if (!this.allows(centerId)) throw new ApiError(404, message, 'NOT_FOUND');
  }

  effective(requested: string[]): string[] {
    if (this.centerIds === null) return requested;
    if (requested.length === 0) return this.centerIds;
    const allowed = requested.filter((id) => this.centerIds!.includes(id));
    return allowed.length > 0 ? allowed : [NO_CENTER];
  }

  /** null means unrestricted; otherwise callers apply explicit joins and Drizzle predicates. */
  formation(): string[] | null {
    return this.centerIds;
  }

  assertAssignableCenters(centerIds: string[]): void {
    if (!this.isRestricted) return;
    if (centerIds.length === 0) {
      throw new ApiError(403, 'Vous devez affecter au moins un de vos centres à cet utilisateur.', 'CENTER_REQUIRED');
    }
    centerIds.forEach((id) => this.assertCenter(id));
  }
}

export async function loadUserAccess(
  tx: TenantClient,
  orgId: string,
  userId: string
): Promise<{ roles: string[]; scope: CenterScope }> {
  const [user] = await tx.select({ id: users.id, roles: users.roles }).from(users)
    .where(and(eq(users.id, userId), eq(users.organizationId, orgId))).limit(1);
  if (!user) throw new ApiError(401, 'Unauthorized', 'USER_NOT_FOUND');
  if (user.roles.includes(ROLES.ADMIN)) return { roles: user.roles, scope: new CenterScope(null, true) };
  const assignments = await tx.select({ id: centers.id }).from(centerUsers)
    .innerJoin(centers, eq(centers.id, centerUsers.centerId))
    .where(and(eq(centerUsers.userId, userId), eq(centers.organizationId, orgId)));
  const ids = assignments.map((c) => c.id);
  return { roles: user.roles, scope: new CenterScope(ids.length > 0 ? ids : null) };
}
