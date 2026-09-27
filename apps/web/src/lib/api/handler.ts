import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext, type TenantClient } from '@/lib/db';
import { getRequestContext, type RequestContext } from '@/lib/auth/context';
import { requireRole } from '@/lib/auth/guards';
import type { Role } from '@/lib/auth/roles';
import { ApiError, toErrorResponse } from './errors';

interface RouteCtx<P> extends RequestContext {
  tx: TenantClient;
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
    permission?: { resource: string; action: 'read' | 'write' };
  }
) {
  return async (req: NextRequest, routeArgs: { params: P }) => {
    try {
      const requestCtx = getRequestContext(req);
      if (opts?.allowedRoles) requireRole(requestCtx.roles, opts.allowedRoles);

      return await withTenantContext(requestCtx.orgId, async (tx) => {
        // Vérification de la suspension de l'organisation (Phase 12, 13)
        const org = await tx.organization.findUnique({
          where: { id: requestCtx.orgId },
          select: { status: true },
        });

        if (!org || org.status === 'suspendu') {
          throw new ApiError(403, 'Votre organisation est suspendue. Accès refusé.', 'ORG_SUSPENDED');
        }

        if (opts?.permission) {
          if (!requestCtx.roles || requestCtx.roles.length === 0) {
            throw new ApiError(403, 'Accès refusé. Aucun rôle assigné.', 'FORBIDDEN');
          }
          
          const hasPerm = await tx.rolePermission.findFirst({
            where: {
              role: { name: { in: requestCtx.roles } },
              resource: opts.permission.resource,
              ...(opts.permission.action === 'read' ? { canRead: true } : { canWrite: true })
            }
          });
          
          if (!hasPerm) {
             throw new ApiError(403, 'Permission insuffisante pour cette action.', 'FORBIDDEN');
          }
        }

        return handler(req, {
          ...requestCtx,
          tx,
          params: routeArgs.params,
          searchParams: req.nextUrl.searchParams,
        });
      });
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}
