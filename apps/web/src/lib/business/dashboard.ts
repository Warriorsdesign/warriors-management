import type { TenantClient } from '@/lib/db';
import type { Installment } from './paymentSchedule';

const INACTIVE_STATUSES = ['formation_terminee', 'abandonne'];
const ENTRY_STATUSES = ['nouvel_inscrit', 'reinscrit'];

function monthKey(date: Date): string {
  // Composantes locales (pas toISOString/UTC) pour rester cohérent avec monthLabel,
  // qui utilise toLocaleDateString - mélanger les deux désynchronise clé et libellé
  // près des changements de mois selon le fuseau horaire du serveur.
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
}

function lastNMonths(n: number, now: Date): { key: string; label: string; date: Date }[] {
  const months: { key: string; label: string; date: Date }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: monthKey(d), label: monthLabel(d), date: d });
  }
  return months;
}

export async function getDashboardStats(tx: TenantClient, orgId: string) {
  const now = new Date();
  const currentMonthKey = monthKey(now);

  const [payments, expenses, students, schedules, formations] = await Promise.all([
    tx.payment.findMany({ where: { organizationId: orgId }, orderBy: { date: 'desc' } }),
    tx.expense.findMany({ where: { organizationId: orgId } }),
    tx.student.findMany({
      where: { organizationId: orgId },
      include: { classGroup: { select: { formationId: true } } },
    }),
    tx.paymentSchedule.findMany({ where: { organizationId: orgId } }),
    tx.formation.findMany({ where: { organizationId: orgId } }),
  ]);

  const revenueThisMonth = payments
    .filter((p) => monthKey(p.date) === currentMonthKey)
    .reduce((sum, p) => sum + p.amount, 0);
  const expensesThisMonth = expenses
    .filter((e) => monthKey(e.date) === currentMonthKey)
    .reduce((sum, e) => sum + e.amount, 0);

  const activeStudents = students.filter((s) => !INACTIVE_STATUSES.includes(s.currentStatus)).length;
  const totalStudents = students.length;

  const totalToCollect = schedules.reduce((sum, s) => sum + s.remainingAmount, 0);
  const lateSchedules = schedules.filter((s) => s.status === 'en_retard');
  const totalLateAmount = lateSchedules.reduce((sum, s) => sum + s.remainingAmount, 0);
  const totalLateInstallments = lateSchedules.reduce((count, s) => {
    const installments = s.installments as Installment[] | null;
    if (!installments) return count + 1;
    return count + installments.filter((i) => i.status === 'en_retard').length;
  }, 0);

  const toCollectByFormation = formations.map((f) => {
    const studentIds = new Set(students.filter((s) => s.classGroup?.formationId === f.id).map((s) => s.id));
    const value = schedules
      .filter((s) => studentIds.has(s.studentId))
      .reduce((sum, s) => sum + s.remainingAmount, 0);
    return { formationId: f.id, name: f.name, value };
  });

  const entries = students.filter(
    (s) => ENTRY_STATUSES.includes(s.currentStatus) || monthKey(s.enrollmentDate) === currentMonthKey
  ).length;
  const exits = students.filter((s) => INACTIVE_STATUSES.includes(s.currentStatus)).length;

  const studentFlowByFormation = formations.map((f) => {
    const inFormation = students.filter((s) => s.classGroup?.formationId === f.id);
    return {
      formationId: f.id,
      name: f.name,
      entries: inFormation.filter((s) => !INACTIVE_STATUSES.includes(s.currentStatus)).length,
      exits: inFormation.filter((s) => INACTIVE_STATUSES.includes(s.currentStatus)).length,
    };
  });

  const months = lastNMonths(6, now);
  const revenueSeries = months.map(({ key, label }) => ({
    month: key,
    label,
    revenue: payments.filter((p) => monthKey(p.date) === key).reduce((sum, p) => sum + p.amount, 0),
  }));
  const flowSeries = months.map(({ key, label }) => ({
    month: key,
    label,
    entrees: students.filter((s) => monthKey(s.enrollmentDate) === key).length,
    sorties: students.filter(
      (s) => INACTIVE_STATUSES.includes(s.currentStatus) && monthKey(s.updatedAt) === key
    ).length,
  }));

  const studentById = new Map(students.map((s) => [s.id, s]));
  const latePayments = lateSchedules.flatMap((s) => {
    const student = studentById.get(s.studentId);
    const installments = (s.installments as Installment[] | null) ?? [];
    return installments
      .filter((i) => i.status === 'en_retard')
      .map((i) => ({
        studentId: s.studentId,
        firstName: student?.firstName ?? '',
        lastName: student?.lastName ?? '',
        matricule: student?.matricule ?? '',
        dueDate: i.dueDate,
        amount: i.amount,
      }));
  });

  const recentPayments = payments.slice(0, 5).map((p) => {
    const student = studentById.get(p.studentId);
    return {
      id: p.id,
      studentId: p.studentId,
      firstName: student?.firstName ?? '',
      lastName: student?.lastName ?? '',
      amount: p.amount,
      date: p.date,
    };
  });

  return {
    revenueThisMonth,
    expensesThisMonth,
    netIncome: revenueThisMonth - expensesThisMonth,
    activeStudents,
    totalStudents,
    totalToCollect,
    totalLateAmount,
    totalLateInstallments,
    toCollectByFormation,
    studentFlow: { entries, exits, netBalance: entries - exits, byFormation: studentFlowByFormation },
    revenueSeries,
    flowSeries,
    latePayments,
    recentPayments,
  };
}
