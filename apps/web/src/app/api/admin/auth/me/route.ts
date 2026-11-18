import { NextResponse } from 'next/server';
import { withAdminRoute } from '@/lib/api/admin-handler';

export const GET = withAdminRoute(async (_req, { prisma, adminUser }) => {
  const user = await prisma.user.findUnique({
    where: { id: adminUser.id },
    select: {
      id: true,
      matricule: true,
      firstName: true,
      lastName: true,
      email: true,
      avatarUrl: true,
      isSuperAdmin: true,
      status: true,
      createdAt: true,
    },
  });

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
