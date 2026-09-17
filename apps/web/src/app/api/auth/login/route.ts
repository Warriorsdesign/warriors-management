import { NextResponse } from 'next/server';
import { authPrisma } from '@/lib/db/auth-client';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth/jwt';

export async function POST(request: Request) {
  try {
    const { matricule, password } = await request.json();

    if (!matricule || !password) {
      return NextResponse.json(
        { error: 'Matricule et mot de passe requis.' },
        { status: 400 }
      );
    }

    // Use authPrisma which runs with app_auth role, allowing read access to Users regardless of RLS
    const user = await authPrisma.user.findUnique({
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

    // Sign JWT
    const token = await signToken({
      userId: user.id,
      orgId: user.organizationId,
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
