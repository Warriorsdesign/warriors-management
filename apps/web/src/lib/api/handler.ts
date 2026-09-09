import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext, type TenantClient } from '@/lib/db';
import { getRequestContext, type RequestContext } from '@/lib/auth/context';
import { requireRole } from '@/lib/auth/guards';
import type { Role } from '@/lib/auth/roles';
import { toErrorResponse } from './errors';

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
  opts?: { allowedRoles?: readonly Role[] }
) {
  return async (req: NextRequest, routeArgs: { params: P }) => {
    try {
      const requestCtx = getRequestContext(req);
      if (opts?.allowedRoles) requireRole(requestCtx.roles, opts.allowedRoles);

      return await withTenantContext(requestCtx.orgId, (tx) =>
        handler(req, {
          ...requestCtx,
          tx,
          params: routeArgs.params,
          searchParams: req.nextUrl.searchParams,
        })
      );
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}
