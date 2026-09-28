import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext, type TenantClient } from '@/lib/db';
import { getRequestContext, type RequestContext } from '@/lib/auth/context';
import { requireRole } from '@/lib/auth/guards';
import { loadPermissions, type PermissionSet } from '@/lib/auth/permissions';
import type { PermissionAction, PermissionResource } from '@/lib/auth/permissionCatalog';
import { loadUserAccess, type CenterScope } from '@/lib/auth/centerScope';
import type { Role } from '@/lib/auth/roles';
import { ApiError, toErrorResponse } from './errors';

interface RouteCtx<P> extends RequestContext {
  tx: TenantClient;
  /** Centres accessibles à l'utilisateur (voir lib/auth/centerScope.ts) : à appliquer à toute donnée rattachée à un centre. */
  scope: CenterScope;
  /** Permissions effectives (rôles de l'organisation, ADMIN = tout) : à consulter pour les données sensibles. */
  perms: PermissionSet;
  params: P;
  searchParams: URLSearchParams;
}

/**
 * Point de composition unique pour toutes les routes API : résout {orgId, userId, roles}
 * depuis les headers injectés par le middleware, vérifie le rôle si demandé, ouvre la
 * transaction RLS via withTenantContext, et convertit toute erreur levée en réponse HTTP
 * cohérente. Garde chaque handler de route court et focalisé sur sa logique métier.
 */
export function withApiRoute<P = Record<string, string>>(
  handler: (req: NextRequest, ctx: RouteCtx<P>) => Promise<NextResponse>,
  opts?: { 
    allowedRoles?: readonly Role[];
    permission?: { resource: PermissionResource; action: PermissionAction };
    /** Timeout (ms) de la transaction RLS, pour les traitements de masse. Défaut : 15 s. */
    transactionTimeout?: number;
  }
) {
  return async (req: NextRequest, routeArgs: { params: P }) => {
    try {
      const requestCtx = getRequestContext(req);

      return await withTenantContext(requestCtx.orgId, async (tx) => {
        // Vérification de la suspension de l'organisation (Phase 12, 13)
        const org = await tx.organization.findUnique({
          where: { id: requestCtx.orgId },
          select: { status: true },
        });

        if (!org || org.status === 'suspendu') {
          throw new ApiError(403, 'Votre organisation est suspendue. Accès refusé.', 'ORG_SUSPENDED');
        }

        // Rôles relus en base à chaque requête (ceux du JWT peuvent dater de la connexion).
        const { roles, scope } = await loadUserAccess(tx, requestCtx.orgId, requestCtx.userId);
        if (opts?.allowedRoles) requireRole(roles, opts.allowedRoles);
        const perms = await loadPermissions(tx, requestCtx.orgId, roles);
        if (opts?.permission) {
          if (roles.length === 0) {
            throw new ApiError(403, 'Accès refusé. Aucun rôle assigné.', 'FORBIDDEN');
          }
          perms.assert(opts.permission.resource, opts.permission.action);
        }

        return handler(req, {
          ...requestCtx,
          roles,
          tx,
          scope,
          perms,
          params: routeArgs.params,
          searchParams: req.nextUrl.searchParams,
        });
      }, { timeout: opts?.transactionTimeout });
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}
