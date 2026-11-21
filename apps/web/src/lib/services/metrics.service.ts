import { count, desc, eq, sum } from 'drizzle-orm';
import { db } from '@/lib/db';
import { auditLogs, centers, organizations, platformPayments, students, subscriptions, users } from '@/lib/db/schema';

async function tableCount(table: typeof organizations | typeof centers | typeof users | typeof students, condition?: ReturnType<typeof eq>) {
  const [row] = await db.select({ count: count() }).from(table).where(condition);
  return row?.count ?? 0;
}

export const metricsService = {
  async getGlobalMetrics() {
    const [
      totalOrganizations,
      activeOrganizations,
      suspendedOrganizations,
      totalCenters,
      totalUsers,
      totalStudents,
      subscriptionsStats,
      organizationRows,
      recentAuditLogs,
      monthlyOrgRegistrations,
      revenueRows,
    ] = await Promise.all([
      tableCount(organizations),
      tableCount(organizations, eq(organizations.status, 'actif')),
      tableCount(organizations, eq(organizations.status, 'suspendu')),
      tableCount(centers),
      tableCount(users),
      tableCount(students),
      db.select({ status: subscriptions.status, count: count() }).from(subscriptions).groupBy(subscriptions.status),
      db.select({
        id: organizations.id,
        name: organizations.name,
        email: organizations.email,
        status: organizations.status,
        createdAt: organizations.createdAt,
      }).from(organizations).orderBy(desc(organizations.createdAt)).limit(5),
      db.select({
        id: auditLogs.id,
        actorEmail: auditLogs.actorEmail,
        actorName: auditLogs.actorName,
        action: auditLogs.action,
        resource: auditLogs.resource,
        resourceId: auditLogs.resourceId,
        createdAt: auditLogs.createdAt,
      }).from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(6),
      db.select({ createdAt: organizations.createdAt }).from(organizations).orderBy(organizations.createdAt),
      db.select({ amount: sum(platformPayments.amount) }).from(platformPayments)
        .where(eq(platformPayments.status, 'COMPLETED')),
    ]);

    const recentIds = organizationRows.map((org) => org.id);
    const [centerCounts, userCounts, studentCounts] = recentIds.length
      ? await Promise.all([
          db.select({ organizationId: centers.organizationId, count: count() }).from(centers)
            .groupBy(centers.organizationId),
          db.select({ organizationId: users.organizationId, count: count() }).from(users)
            .groupBy(users.organizationId),
          db.select({ organizationId: students.organizationId, count: count() }).from(students)
            .groupBy(students.organizationId),
        ])
      : [[], [], []];
    const countMap = (rows: { organizationId: string | null; count: number }[]) =>
      new Map(rows.map((row) => [row.organizationId, row.count]));
    const centersByOrg = countMap(centerCounts);
    const usersByOrg = countMap(userCounts);
    const studentsByOrg = countMap(studentCounts);
    const recentOrganizations = organizationRows.map((org) => ({
      ...org,
      _count: {
        centers: centersByOrg.get(org.id) ?? 0,
        users: usersByOrg.get(org.id) ?? 0,
        students: studentsByOrg.get(org.id) ?? 0,
      },
    }));

    const subsMap: Record<string, number> = { active: 0, trial: 0, expired: 0, suspended: 0 };
    for (const row of subscriptionsStats) subsMap[row.status] = row.count;

    const monthsMap: Record<string, number> = {};
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthsMap[`${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(2)}`] = 0;
    }
    for (const org of monthlyOrgRegistrations) {
      const date = new Date(org.createdAt);
      const key = `${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(2)}`;
      if (monthsMap[key] !== undefined) monthsMap[key]++;
    }

    return {
      kpis: {
        totalOrganizations,
        activeOrganizations,
        suspendedOrganizations,
        totalCenters,
        totalUsers,
        totalStudents,
        subscriptions: subsMap,
        totalRevenue: Number(revenueRows[0]?.amount ?? 0),
      },
      recentOrganizations,
      recentAuditLogs,
      growthChart: Object.entries(monthsMap).map(([month, count]) => ({ month, organizations: count })),
    };
  },
};
