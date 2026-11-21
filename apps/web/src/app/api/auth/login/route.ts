import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, organizations, subscriptions, plans } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { TenantClient } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { subscriptionService } from '@/lib/services/subscription.service';
import { isOnboardingRequired, PASSWORD_CHANGE_PAGE, setAuthCookie } from '@/lib/auth/session';
import { getAccessBlock } from '@/lib/business/subscriptionAccess';
import { clientIp, loginThrottleResponse, recordLoginFailure } from '@/lib/auth/loginThrottle';

export async function POST(request: Request) {
  try {
    // Vérification et suspension paresseuse des abonnements expirés (sans bloquer la requête)
    subscriptionService.checkAndSuspendExpiredOrgs().catch(console.error);

    const body = await request.json();
    const matricule = typeof body.matricule === 'string' ? body.matricule.trim() : body.matricule;
    const password = body.password;
    const ip = clientIp(request);

    if (!matricule || !password) {
      return NextResponse.json(
        { error: 'Matricule et mot de passe requis.' },
        { status: 400 }
      );
    }

    // Login has no organization context yet, so the server-only admin client performs this global lookup.
    const [user] = await db.select().from(users).where(eq(users.matricule, matricule)).limit(1);

    // Trop d'échecs récents sur ce matricule ou depuis cette connexion : refus avant tout contrôle.
    const throttled = await loginThrottleResponse(matricule, ip, user?.lastLoginAt);
    if (throttled) return throttled;

    if (!user) {
      await recordLoginFailure(matricule, ip);
      return NextResponse.json(
        { error: 'Matricule ou mot de passe incorrect.' },
        { status: 401 }
      );
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      await recordLoginFailure(matricule, ip, user.id);
      return NextResponse.json(
        { error: 'Matricule ou mot de passe incorrect.' },
        { status: 401 }
      );
    }

    // Check if the user is active
    if (user.status !== 'actif') {
      return NextResponse.json(
        { error: 'Ce compte est désactivé.' },
        { status: 403 }
      );
    }

    // Un Super Admin sans organisation cliente doit utiliser le portail /admin/login
    if (user.isSuperAdmin && !user.organizationId) {
      return NextResponse.json(
        { error: "Ce compte Super Administrateur doit se connecter via l'espace dédié : /admin/login" },
        { status: 403 }
      );
    }

    // Vérifier si l'organisation cliente est suspendue
    let onboardingRequired = false;
    if (user.organizationId) {
      const [org] = await db.select().from(organizations).where(eq(organizations.id, user.organizationId)).limit(1);
      const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.organizationId, user.organizationId)).limit(1);
      const plan = subscription?.planId ? (await db.select().from(plans).where(eq(plans.id, subscription.planId)).limit(1))[0] : undefined;
      // Suspension, fin d'essai ou d'abonnement : vérifiée ici sans attendre la suspension différée.
      const block = org ? getAccessBlock(org, subscription ? { ...subscription, plan: plan ? { price: plan.price } : null } : null) : null;
      if (block) {
        return NextResponse.json({ error: block.message, code: block.code }, { status: 403 });
      }
      onboardingRequired = await isOnboardingRequired(db as unknown as TenantClient, user.organizationId, user.roles);
    }

    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    // Mot de passe provisoire (création ou réinitialisation par un tiers) : le middleware
    // cantonne la session à la page de changement de mot de passe tant que ce drapeau est présent.
    const passwordChangeRequired = user.mustChangePassword;
    const redirectTo = passwordChangeRequired ? PASSWORD_CHANGE_PAGE : onboardingRequired ? '/onboarding' : null;

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        organizationId: user.organizationId,
      },
      onboardingRequired,
      passwordChangeRequired,
      redirectTo,
    });

    await setAuthCookie(response, {
      userId: user.id,
      orgId: user.organizationId ?? '',
      roles: user.roles,
      ...(passwordChangeRequired ? { mustChangePassword: true } : {}),
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
