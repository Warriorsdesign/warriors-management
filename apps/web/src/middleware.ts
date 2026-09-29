import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, verifyAdminToken } from './lib/auth/jwt';
import { PASSWORD_CHANGE_ALLOWED_PATHS, PASSWORD_CHANGE_PAGE } from './lib/auth/password-change';

/** Pages du site public (landing, inscription, informations légales) : affichées sans l'interface de l'application. */
const PUBLIC_SITE_PAGES = ['/accueil', '/essai', '/informations-legales'];
const PUBLIC_SITE_HEADER = 'x-wm-public-site'; // lu par app/layout.tsx

/** Requête marquée « site public » pour que le layout racine n'affiche ni menu ni barre du haut. */
function publicSite(request: NextRequest, rewriteTo?: string) {
  const headers = new Headers(request.headers);
  headers.set(PUBLIC_SITE_HEADER, '1');
  return rewriteTo
    ? NextResponse.rewrite(new URL(rewriteTo, request.url), { request: { headers } })
    : NextResponse.next({ request: { headers } });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Fichiers statiques et assets Next.js
  if (
    pathname.startsWith('/_next') ||
    pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|woff|woff2|ttf)$/)
  ) {
    return NextResponse.next();
  }

  // =========================================================================
  // 2. ZONE BACK-OFFICE SUPER ADMIN (/admin et /api/admin)
  // =========================================================================
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const isAdminPublic =
      pathname === '/admin/login' || pathname === '/api/admin/auth/login';

    const adminToken = request.cookies.get('admin_auth_token')?.value;

    if (!adminToken) {
      if (isAdminPublic) {
        return NextResponse.next();
      }
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const adminLoginUrl = new URL('/admin/login', request.url);
      adminLoginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(adminLoginUrl);
    }

    try {
      const payload = await verifyAdminToken(adminToken);

      if (!payload.isSuperAdmin) {
        throw new Error('Not a super admin');
      }

      // Si déjà authentifié et tente d'aller sur /admin/login -> rediriger vers le dashboard
      if (pathname === '/admin/login') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }

      // Injecter les headers pour les API et Server Components
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-admin-user-id', payload.userId);
      requestHeaders.set('x-admin-email', payload.email);
      requestHeaders.set('x-is-super-admin', 'true');

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch {
      // Token admin invalide ou expiré
      if (isAdminPublic) {
        return NextResponse.next();
      }
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const adminLoginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(adminLoginUrl);
    }
  }

  // =========================================================================
  // 3. ZONE CLIENT MULTI-TENANT (/login, /, /students, etc.)
  // =========================================================================
  const isClientPublic = pathname === '/login' || pathname.startsWith('/api/auth/login');
  const isPublicSitePage = PUBLIC_SITE_PAGES.includes(pathname);

  // API publiques (inscription à l'essai) : sans session.
  if (pathname.startsWith('/api/public/')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    // Visiteur non connecté : l'adresse racine affiche la landing (l'URL reste « / »).
    if (pathname === '/') return publicSite(request, '/accueil');
    if (isPublicSitePage) return publicSite(request);
    if (isClientPublic) {
      return NextResponse.next();
    }
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const payload = await verifyToken(token);

    // Si déjà connecté et tente d'aller sur /login (ou de recréer un essai) -> tableau de bord
    if (pathname === '/login' || pathname === '/essai') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (isPublicSitePage) return publicSite(request);

    // Mot de passe provisoire : tant qu'il n'est pas changé, seule la page de changement (et les
    // APIs strictement nécessaires) est accessible. Appliqué ici pour couvrir TOUTES les pages et
    // APIs, y compris les appels directs qui contourneraient l'interface.
    if (payload.mustChangePassword) {
      if (!PASSWORD_CHANGE_ALLOWED_PATHS.includes(pathname)) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'Vous devez changer votre mot de passe avant de continuer.', code: 'PASSWORD_CHANGE_REQUIRED' },
            { status: 403 }
          );
        }
        return NextResponse.redirect(new URL(PASSWORD_CHANGE_PAGE, request.url));
      }
    } else if (pathname === PASSWORD_CHANGE_PAGE) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.delete(PUBLIC_SITE_HEADER); // jamais fourni par le navigateur
    requestHeaders.set('x-org-id', payload.orgId);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-roles', JSON.stringify(payload.roles ?? []));

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    // Session expirée ou invalide : même traitement qu'un visiteur.
    if (pathname === '/') return publicSite(request, '/accueil');
    if (isPublicSitePage) return publicSite(request);
    if (isClientPublic) {
      return NextResponse.next();
    }
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
