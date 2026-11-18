import { NextRequest } from 'next/server';
import { ApiError } from '@/lib/api/errors';

export interface RequestContext {
  orgId: string;
  userId: string;
  roles: string[];
}

/**
 * Extrait le contexte d'authentification injecté par le middleware (x-org-id, x-user-id,
 * x-user-roles). Le middleware garantit déjà la présence d'un JWT valide pour toute route
 * /api/* non publique ; l'absence des headers ici signale une mauvaise configuration plutôt
 * qu'un cas utilisateur normal, mais on répond 401 par prudence plutôt que de planter.
 */
export function getRequestContext(request: NextRequest): RequestContext {
  const orgId = request.headers.get('x-org-id');
  const userId = request.headers.get('x-user-id');

  if (!orgId || !userId) {
    throw new ApiError(401, 'Unauthorized', 'MISSING_CONTEXT');
  }

  let roles: string[] = [];
  try {
    roles = JSON.parse(request.headers.get('x-user-roles') ?? '[]');
  } catch {
    roles = [];
  }

  return { orgId, userId, roles };
}
