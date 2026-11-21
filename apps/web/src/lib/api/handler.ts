import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { withTenantContext } from '@/lib/db';
import type { TenantClient } from '@/lib/db-types';
import { organizations, plans, subscriptions } from '@/lib/db/schema';
import { getRequestContext, type RequestContext } from '@/lib/auth/context';
import { requireRole } from '@/lib/auth/guards';
import { loadPermissions, type PermissionSet } from '@/lib/auth/permissions';
import type { PermissionAction, PermissionResource } from '@/lib/auth/permissionCatalog';
import { loadUserAccess, type CenterScope } from '@/lib/auth/centerScope';
import type { Role } from '@/lib/auth/roles';
import { ApiError, toErrorResponse } from './errors';
import { getAccessBlock } from '@/lib/business/subscriptionAccess';

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
        // Organisation suspendue, essai ou abonnement terminé : accès coupé (Phase 12, 13).
        const [access] = await tx
          .select({
            status: organizations.status,
            name: organizations.name,
            subscriptionStatus: subscriptions.status,
            subscriptionEndDate: subscriptions.endDate,
            planPrice: plans.price,
          })
          .from(organizations)
          .leftJoin(subscriptions, eq(subscriptions.organizationId, organizations.id))
          .leftJoin(plans, eq(plans.id, subscriptions.planId))
          .where(eq(organizations.id, requestCtx.orgId))
          .limit(1);
        if (!access) {
          throw new ApiError(403, 'Votre organisation est suspendue. Accès refusé.', 'ORG_SUSPENDED');
        }
        const org = { status: access.status, name: access.name };
        const subscription = access.subscriptionStatus && access.subscriptionEndDate
          ? {
              status: access.subscriptionStatus,
              endDate: access.subscriptionEndDate,
              plan: access.planPrice === null ? null : { price: access.planPrice },
            }
          : null;
        const block = getAccessBlock(org, subscription);
        if (block) {
          // Un seul code côté client (ORG_SUSPENDED) ; le message précise la raison.
          throw new ApiError(403, block.message, 'ORG_SUSPENDED', { reason: block.code });
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
