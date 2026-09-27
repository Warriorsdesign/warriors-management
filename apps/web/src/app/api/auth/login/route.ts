import { NextResponse } from 'next/server';
import { adminPrisma } from '@/lib/db/admin';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth/jwt';
import { subscriptionService } from '@/lib/services/subscription.service';

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
    if (user.organizationId) {
      const org = await adminPrisma.organization.findUnique({
        where: { id: user.organizationId },
        select: { status: true, name: true },
      });
      if (org && org.status === 'suspendu') {
        return NextResponse.json(
          { error: `L'organisation "${org.name}" est actuellement suspendue. Accès bloqué.` },
          { status: 403 }
        );
      }
    }

    // Sign JWT
    const token = await signToken({
      userId: user.id,
      orgId: user.organizationId ?? '',
      roles: user.roles,
    });

    // Create the response and set the cookie
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
    });

    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
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
