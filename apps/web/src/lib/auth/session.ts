import type { NextResponse } from 'next/server';
import type { TenantClient } from '@/lib/db';
import { hasPermission } from './permissions';
import { signToken, type TokenPayload } from './jwt';

export const AUTH_COOKIE = 'auth_token';

export { PASSWORD_CHANGE_PAGE } from './password-change';

export async function setAuthCookie(response: NextResponse, payload: TokenPayload): Promise<void> {
  response.cookies.set({
    name: AUTH_COOKIE,
    value: await signToken(payload),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // Cookie de session (sans maxAge) : effacé à la fermeture du navigateur. Le JWT expire
    // de toute façon au bout de 24 heures ; la fermeture d'un onglet est gérée côté client
    // (lib/auth/tabSession.ts).
  });
}

/**
 * L'assistant de configuration est proposé tant que l'organisation ne l'a pas terminé,
 * uniquement aux utilisateurs habilités à configurer l'organisation.
 */
export async function isOnboardingRequired(client: TenantClient, orgId: string, roles: string[]): Promise<boolean> {
  const org = await client.organization.findUnique({ where: { id: orgId }, select: { onboardingStatus: true } });
  if (!org || org.onboardingStatus === 'termine') return false;
  return hasPermission(client, orgId, roles, 'organization', 'write');
}

/** Destination après connexion ou après le changement obligatoire du mot de passe. */
export async function postLoginRedirect(client: TenantClient, orgId: string, roles: string[]): Promise<string> {
  return (await isOnboardingRequired(client, orgId, roles)) ? '/onboarding' : '/';
}
