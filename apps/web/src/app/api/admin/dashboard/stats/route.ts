import { NextResponse } from 'next/server';
import { withAdminRoute } from '@/lib/api/admin-handler';

export const GET = withAdminRoute(async (_req, { prisma }) => {
  // Exécution de requêtes parallèles d'agrégation globale
  const [
    totalOrganizations,
    activeOrganizations,
    suspendedOrganizations,
    totalCenters,
    totalUsers,
    totalStudents,
    subscriptionsStats,
    recentOrganizations,
    recentAuditLogs,
    monthlyOrgRegistrations,
  ] = await Promise.all([
    // 1. Total organisations
    prisma.organization.count(),

    // 2. Organisations actives
    prisma.organization.count({ where: { status: 'actif' } }),

    // 3. Organisations suspendues
    prisma.organization.count({ where: { status: 'suspendu' } }),

    // 4. Total centres
    prisma.center.count(),

    // 5. Total utilisateurs
    prisma.user.count(),

    // 6. Total apprenants
    prisma.student.count(),

    // 7. Stats abonnements
    prisma.subscription.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),

    // 8. Dernières organisations créées
    prisma.organization.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            centers: true,
            users: true,
            students: true,
          },
        },
      },
    }),

    // 9. Derniers logs d'audit
    prisma.auditLog.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        actorEmail: true,
        actorName: true,
        action: true,
        resource: true,
        resourceId: true,
        createdAt: true,
      },
    }),

    // 10. Inscriptions par mois (6 derniers mois)
    prisma.organization.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  // Agréger les abonnements par statut
  const subsMap: Record<string, number> = {
    active: 0,
    trial: 0,
    expired: 0,
    suspended: 0,
  };
  subscriptionsStats.forEach((s) => {
    subsMap[s.status] = s._count._all;
  });

  // Calculer l'évolution mensuelle des inscriptions
  const monthsMap: Record<string, number> = {};
  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  
  // Initialiser les 6 derniers mois
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
    monthsMap[key] = 0;
  }

  monthlyOrgRegistrations.forEach((org) => {
    const d = new Date(org.createdAt);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
    if (monthsMap[key] !== undefined) {
      monthsMap[key]++;
    }
  });

  const chartData = Object.entries(monthsMap).map(([month, count]) => ({
    month,
    organizations: count,
  }));

  return NextResponse.json({
    kpis: {
      totalOrganizations,
      activeOrganizations,
      suspendedOrganizations,
      totalCenters,
      totalUsers,
      totalStudents,
      subscriptions: subsMap,
    },
    recentOrganizations,
    recentAuditLogs,
    growthChart: chartData,
  });
});
