export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { withAdminRoute } from '@/lib/api/admin-handler';

export const GET = withAdminRoute(async (_req, { adminUser }) => {
  const [user] = await db.select({
      id: users.id,
      matricule: users.matricule,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      avatarUrl: users.avatarUrl,
      isSuperAdmin: users.isSuperAdmin,
      status: users.status,
      createdAt: users.createdAt,
    }).from(users).where(eq(users.id, adminUser.id)).limit(1);

  if (!user || !user.isSuperAdmin) {
    return NextResponse.json(
      { error: 'Compte Super Administrateur non trouvé ou révoqué.' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    user,
  });
});
