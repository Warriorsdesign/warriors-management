import type { TenantClient } from '@/lib/db';

const INACTIVE_STATUSES = ['formation_terminee', 'abandonne'];

export interface DateRange {
  from?: Date;
  to?: Date;
}

function inRange(date: Date, range: DateRange): boolean {
  if (range.from && date < range.from) return false;
  if (range.to && date > range.to) return false;
  return true;
}

export async function getReportsSummary(tx: TenantClient, orgId: string, range: DateRange, centerIds: string[] = []) {
  const studentCenterWhere = centerIds.length ? { classGroup: { centerId: { in: centerIds } } } : {};
  const viaStudentCenterWhere = centerIds.length
    ? { student: { classGroup: { centerId: { in: centerIds } } } }
    : {};

  const [students, payments, expenses] = await Promise.all([
    tx.student.findMany({ where: { organizationId: orgId, ...studentCenterWhere } }),
    tx.payment.findMany({ where: { organizationId: orgId, ...viaStudentCenterWhere } }),
    tx.expense.findMany({ where: { organizationId: orgId, ...(centerIds.length ? { centerId: { in: centerIds } } : {}) } }),
  ]);

  const totalActiveStudents = students.filter((s) => !INACTIVE_STATUSES.includes(s.currentStatus)).length;
  const newStudentsInRange = students.filter((s) => inRange(s.enrollmentDate, range)).length;
  const totalRevenueInRange = payments.filter((p) => inRange(p.date, range)).reduce((s, p) => s + p.amount, 0);
  const totalExpensesInRange = expenses.filter((e) => inRange(e.date, range)).reduce((s, e) => s + e.amount, 0);

  return {
    totalActiveStudents,
    newStudentsInRange,
    totalRevenueInRange,
    totalExpensesInRange,
    netIncomeInRange: totalRevenueInRange - totalExpensesInRange,
  };
}

export async function getFormationReports(tx: TenantClient, orgId: string, range: DateRange, centerIds: string[] = []) {
  const studentCenterWhere = centerIds.length ? { classGroup: { centerId: { in: centerIds } } } : {};
  const viaStudentCenterWhere = centerIds.length
    ? { student: { classGroup: { centerId: { in: centerIds } } } }
    : {};

  const [formations, students, payments] = await Promise.all([
    tx.formation.findMany({ where: { organizationId: orgId } }),
    tx.student.findMany({
      where: { organizationId: orgId, ...studentCenterWhere },
      include: { classGroup: { select: { formationId: true } } },
    }),
    tx.payment.findMany({ where: { organizationId: orgId, ...viaStudentCenterWhere } }),
  ]);

  return formations.map((f) => {
    const studentsInFormation = students.filter((s) => s.classGroup?.formationId === f.id);
    const studentIds = new Set(studentsInFormation.map((s) => s.id));
    const dropoutCount = studentsInFormation.filter((s) => s.currentStatus === 'abandonne').length;
    const revenueInRange = payments
      .filter((p) => studentIds.has(p.studentId) && inRange(p.date, range))
      .reduce((s, p) => s + p.amount, 0);

    return {
      formationId: f.id,
      name: f.name,
      studentCount: studentsInFormation.length,
      dropoutCount,
      dropoutRate: studentsInFormation.length > 0 ? dropoutCount / studentsInFormation.length : 0,
      revenueInRange,
    };
  });
}

function monthKey(date: Date): string {
  // Composantes locales, cohérentes avec monthLabel - voir dashboard.ts pour le détail du bug évité.
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
}

export async function getFinanceSeries(tx: TenantClient, orgId: string, range: DateRange, centerIds: string[] = []) {
  const now = new Date();
  const from = range.from ?? new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const to = range.to ?? now;
  const viaStudentCenterWhere = centerIds.length
    ? { student: { classGroup: { centerId: { in: centerIds } } } }
    : {};

  const [payments, expenses] = await Promise.all([
    tx.payment.findMany({ where: { organizationId: orgId, date: { gte: from, lte: to }, ...viaStudentCenterWhere } }),
    tx.expense.findMany({
      where: {
        organizationId: orgId,
        date: { gte: from, lte: to },
        ...(centerIds.length ? { centerId: { in: centerIds } } : {}),
      },
    }),
  ]);

  const months: { key: string; label: string }[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);
  while (cursor <= end) {
    months.push({ key: monthKey(cursor), label: monthLabel(cursor) });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months.map(({ key, label }) => ({
    month: key,
    label,
    revenue: payments.filter((p) => monthKey(p.date) === key).reduce((s, p) => s + p.amount, 0),
    expenses: expenses.filter((e) => monthKey(e.date) === key).reduce((s, e) => s + e.amount, 0),
  }));
}
