import { NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api/handler';
import { PERMISSIONS } from '@/lib/auth/roles';

export const GET = withApiRoute(async (_req, { tx, orgId }) => {
  const organization = await tx.organization.findUnique({
    where: { id: orgId },
    include: {
      subscription: {
        include: {
          plan: true,
        },
      },
      _count: {
        select: { centers: true, students: true },
      },
      platformPayments: {
        orderBy: { date: 'desc' },
        include: { plan: true },
      },
    },
  });

  if (!organization) {
    return NextResponse.json({ error: 'Organisation introuvable' }, { status: 404 });
  }

  // Calculer dynamiquement le statut expiré (si on n'a pas encore fait la tâche en background)
  const sub = organization.subscription;
  if (sub) {
    const now = new Date();
    if (new Date(sub.endDate) < now && sub.status !== 'suspended') {
      sub.status = 'expired';
    }
  }

  return NextResponse.json({
    subscription: sub,
    usage: {
      centers: organization._count.centers,
      students: organization._count.students,
    },
    payments: organization.platformPayments,
  });
}, { permission: { resource: 'organization', action: 'read' } });
