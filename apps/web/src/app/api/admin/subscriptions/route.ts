import { NextResponse } from 'next/server';
import { withAdminRoute } from '@/lib/api/admin-handler';
import { logAuditEvent } from '@/lib/audit/audit-logger';

export const GET = withAdminRoute(async (req, { prisma, searchParams }) => {
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search')?.trim() || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '15', 10)));

  const where: any = {};

  if (status && status !== 'all') {
    where.status = status;
  }

  if (search) {
    where.organization = {
      name: { contains: search, mode: 'insensitive' },
    };
  }

  const [total, subscriptions] = await Promise.all([
    prisma.subscription.count({ where }),
    prisma.subscription.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { endDate: 'asc' },
      include: {
        plan: true,
        organization: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            _count: {
              select: {
                centers: true,
                students: true,
              },
            },
          },
        },
      },
    }),
  ]);

  // Calculer dynamiquement le statut expiré si la date de fin est dépassée
  const now = new Date();
  const enhanced = subscriptions.map((sub) => {
    let computedStatus = sub.status;
    if (new Date(sub.endDate) < now && sub.status !== 'suspended') {
      computedStatus = 'expired';
    }
    const daysLeft = Math.ceil(
      (new Date(sub.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      ...sub,
      status: computedStatus,
      daysLeft,
      plan: sub.plan?.name ?? "-",
      planId: sub.planId
    };
  });

  return NextResponse.json({
    subscriptions: enhanced,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

export const PATCH = withAdminRoute(async (req, { prisma, adminUser }) => {
  const body = await req.json();
  const { id, planId, status, endDate, maxCenters, maxStudents } = body;

  if (!id) {
    return NextResponse.json(
      { error: "L'identifiant de la souscription est obligatoire." },
      { status: 400 }
    );
  }

  const existing = await prisma.subscription.findUnique({
    where: { id },
    include: { organization: true, plan: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: 'Abonnement introuvable.' },
      { status: 404 }
    );
  }

  const updated = await prisma.subscription.update({
    where: { id },
    data: {
      planId: planId || existing.planId,
      status: status || existing.status,
      endDate: endDate ? new Date(endDate) : existing.endDate,
      maxCenters: maxCenters !== undefined ? Number(maxCenters) : existing.maxCenters,
      maxStudents: maxStudents !== undefined ? Number(maxStudents) : existing.maxStudents,
    },
    include: { organization: true, plan: true },
  });

  // Synchroniser le statut de l'organisation
  if (status && status !== existing.status) {
    const orgStatus = ['active', 'trial'].includes(status) ? 'actif' : 'suspendu';
    await prisma.organization.update({
      where: { id: existing.organizationId },
      data: { status: orgStatus },
    });
    // On met à jour l'objet pour l'audit
    updated.organization.status = orgStatus;
  }

  await logAuditEvent({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    actorName: 'Super Admin',
    action: 'SUBSCRIPTION_UPDATED',
    resource: 'Subscription',
    resourceId: id,
    details: {
      organizationName: existing.organization.name,
      plan: updated.plan?.name,
      status: updated.status,
      endDate: updated.endDate,
    },
  });

  return NextResponse.json({
    success: true,
    subscription: updated,
    message: 'Abonnement mis à jour avec succès.',
  });
});
