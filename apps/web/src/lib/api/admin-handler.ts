import { NextRequest, NextResponse } from 'next/server';
import { adminPrisma } from '@/lib/db/admin';
import { ApiError, toErrorResponse } from './errors';
import type { PrismaClient } from '@prisma/client';

export interface AdminUserContext {
  id: string;
  email: string;
  isSuperAdmin: boolean;
}

export interface AdminRouteCtx<P = Record<string, string>> {
  prisma: PrismaClient;
  adminUser: AdminUserContext;
  params: P;
  searchParams: URLSearchParams;
}

/**
 * Wrapper de sécurité pour toutes les routes d'API Super Administrateur (/api/admin/*).
 * Vérifie que la requête provient d'un Super Admin authentifié (via headers injectés par le middleware).
 * Fournit l'instance adminPrisma avec droits globaux et gère les erreurs de façon unifiée.
 */
export function withAdminRoute<P = Record<string, string>>(
  handler: (req: NextRequest, ctx: AdminRouteCtx<P>) => Promise<NextResponse>
) {
  return async (req: NextRequest, routeArgs: { params: P }) => {
    try {
      const adminUserId = req.headers.get('x-admin-user-id');
      const adminEmail = req.headers.get('x-admin-email');
      const isSuperAdmin = req.headers.get('x-is-super-admin') === 'true';

      if (!adminUserId || !adminEmail || !isSuperAdmin) {
        throw new ApiError(403, 'Accès interdit. Droits Super Administrateur requis.', 'FORBIDDEN');
      }

      return await handler(req, {
        prisma: adminPrisma,
        adminUser: {
          id: adminUserId,
          email: adminEmail,
          isSuperAdmin,
        },
        params: routeArgs.params,
        searchParams: req.nextUrl.searchParams,
      });
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}
