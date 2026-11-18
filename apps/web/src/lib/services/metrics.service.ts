import { adminPrisma } from '@/lib/db/admin';

export const metricsService = {
  /**
   * Récupère les métriques globales pour le dashboard super admin
   */
  async getGlobalMetrics() {
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
      revenueResult,
    ] = await Promise.all([
      // 1. Total organisations
      adminPrisma.organization.count(),

      // 2. Organisations actives
      adminPrisma.organization.count({ where: { status: 'actif' } }),

      // 3. Organisations suspendues
      adminPrisma.organization.count({ where: { status: 'suspendu' } }),

      // 4. Total centres
      adminPrisma.center.count(),

      // 5. Total utilisateurs
      adminPrisma.user.count(),

      // 6. Total apprenants
      adminPrisma.student.count(),

      // 7. Stats abonnements
      adminPrisma.subscription.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),

      // 8. Dernières organisations créées
      adminPrisma.organization.findMany({
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
      adminPrisma.auditLog.findMany({
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
      adminPrisma.organization.findMany({
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),

      // 11. Chiffre d'Affaires
      adminPrisma.platformPayment.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' },
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

    return {
      kpis: {
        totalOrganizations,
        activeOrganizations,
        suspendedOrganizations,
        totalCenters,
        totalUsers,
        totalStudents,
        subscriptions: subsMap,
        totalRevenue: revenueResult._sum.amount || 0,
      },
      recentOrganizations,
      recentAuditLogs,
      growthChart: chartData,
    };
  }
};
