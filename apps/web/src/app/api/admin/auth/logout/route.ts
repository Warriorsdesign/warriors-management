import { NextResponse, NextRequest } from 'next/server';
import { verifyAdminToken } from '@/lib/auth/jwt';
import { logAuditEvent } from '@/lib/audit/audit-logger';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('admin_auth_token')?.value;

  if (token) {
    try {
      const payload = await verifyAdminToken(token);
      await logAuditEvent({
        actorId: payload.userId,
        actorEmail: payload.email,
        actorName: 'Super Admin',
        action: 'ADMIN_LOGOUT',
        resource: 'Security',
        resourceId: payload.userId,
      });
    } catch {
      // Ignorer l'erreur d'audit si le token était déjà invalide
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: 'admin_auth_token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
