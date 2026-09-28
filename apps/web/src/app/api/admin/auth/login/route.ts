import { NextResponse } from 'next/server';
import { adminPrisma } from '@/lib/db/admin';
import bcrypt from 'bcryptjs';
import { signAdminToken } from '@/lib/auth/jwt';
import { logAuditEvent } from '@/lib/audit/audit-logger';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Recherche de l'utilisateur avec privilèges Super Admin
    const user = await adminPrisma.user.findFirst({
      where: {
        email: normalizedEmail,
        isSuperAdmin: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Identifiants invalides ou droits Super Administrateur inexistants.' },
        { status: 401 }
      );
    }

    // Validation du mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Identifiants invalides ou droits Super Administrateur inexistants.' },
        { status: 401 }
      );
    }

    // Vérification du statut
    if (user.status !== 'actif') {
      return NextResponse.json(
        { error: 'Ce compte Super Administrateur est suspendu ou inactif.' },
        { status: 403 }
      );
    }

    // Signature du token JWT Super Admin
    const token = await signAdminToken({
      userId: user.id,
      email: user.email,
      isSuperAdmin: true,
    });

    // Journal d'audit de la connexion
    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      actorName: `${user.firstName} ${user.lastName}`,
      action: 'ADMIN_LOGIN',
      resource: 'Security',
      resourceId: user.id,
      details: {
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') ?? '127.0.0.1',
      },
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isSuperAdmin: true,
      },
    });

    // Émission du cookie dédié admin_auth_token
    response.cookies.set({
      name: 'admin_auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      // Cookie de session : effacé à la fermeture du navigateur (le JWT expire après 12 heures).
    });

    return response;
  } catch (error) {
    console.error('Super Admin login error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
