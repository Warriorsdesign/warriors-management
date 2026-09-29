import { NextResponse } from 'next/server';
import { adminPrisma } from '@/lib/db/admin';
import bcrypt from 'bcryptjs';
import { subscriptionService } from '@/lib/services/subscription.service';
import { isOnboardingRequired, PASSWORD_CHANGE_PAGE, setAuthCookie } from '@/lib/auth/session';
import { getAccessBlock } from '@/lib/business/subscriptionAccess';

export async function POST(request: Request) {
  try {
    // Vérification et suspension paresseuse des abonnements expirés (sans bloquer la requête)
    subscriptionService.checkAndSuspendExpiredOrgs().catch(console.error);

    const { matricule, password } = await request.json();

    if (!matricule || !password) {
      return NextResponse.json(
        { error: 'Matricule et mot de passe requis.' },
        { status: 400 }
      );
    }

    // Utilisation de adminPrisma (qui fonctionne) au lieu de authPrisma pour contourner le timeout de Supavisor
    const user = await adminPrisma.user.findUnique({
      where: { matricule },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Matricule ou mot de passe incorrect.' },
        { status: 401 }
      );
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
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
      const org = await adminPrisma.organization.findUnique({
        where: { id: user.organizationId },
        select: {
          status: true,
          name: true,
          subscription: { select: { status: true, endDate: true, plan: { select: { price: true } } } },
        },
      });
      // Suspension, fin d'essai ou d'abonnement : vérifiée ici sans attendre la suspension différée.
      const block = org ? getAccessBlock(org, org.subscription) : null;
      if (block) {
        return NextResponse.json({ error: block.message, code: block.code }, { status: 403 });
      }
      onboardingRequired = await isOnboardingRequired(adminPrisma, user.organizationId, user.roles);
    }

    await adminPrisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

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
