import type { Prisma } from '@prisma/client';
import type { TenantClient } from '@/lib/db';
import type { Installment } from './paymentSchedule';
import type { ResolvedPeriod } from '@/lib/api/periodRange';
import { getFinanceSeries } from './reports';

const INACTIVE_STATUSES = ['formation_terminee', 'abandonne'];
const ENTRY_STATUSES = ['nouvel_inscrit', 'reinscrit'];

function inRange(date: Date, from: Date, to: Date): boolean {
  return date >= from && date <= to;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

export async function getDashboardStats(
  tx: TenantClient,
  orgId: string,
  centerIds: string[],
  formationIds: string[],
  period: ResolvedPeriod,
  /** Formations visibles dans le périmètre de centres de l'utilisateur (voir CenterScope.formation). */
  formationScope: Prisma.FormationWhereInput = {}
) {
  const now = new Date();

  // Note: les dépenses n'ont pas de formation associée (seulement un centre) - le filtre
  // formation ne s'applique donc qu'aux requêtes qui passent par un étudiant/classe.
  const classGroupFilter = {
    ...(centerIds.length ? { centerId: { in: centerIds } } : {}),
    ...(formationIds.length ? { formationId: { in: formationIds } } : {}),
  };
  const hasClassGroupFilter = centerIds.length > 0 || formationIds.length > 0;
  const studentCenterWhere = hasClassGroupFilter ? { classGroup: classGroupFilter } : {};
  const viaStudentCenterWhere = hasClassGroupFilter ? { student: { classGroup: classGroupFilter } } : {};

  const [payments, expenses, students, schedules, formations] = await Promise.all([
    tx.payment.findMany({ where: { organizationId: orgId, ...viaStudentCenterWhere }, orderBy: { date: 'desc' } }),
    tx.expense.findMany({ where: { organizationId: orgId, ...(centerIds.length ? { centerId: { in: centerIds } } : {}) } }),
    tx.student.findMany({
      where: { organizationId: orgId, ...studentCenterWhere },
      include: { classGroup: { select: { formationId: true, formation: { select: { name: true } } } } },
    }),
    tx.paymentSchedule.findMany({ where: { organizationId: orgId, ...viaStudentCenterWhere } }),
    tx.formation.findMany({ where: { organizationId: orgId, ...formationScope } }),
  ]);

  const studentById = new Map(students.map((s) => [s.id, s]));
  const formationNameFor = (studentId: string): string => studentById.get(studentId)?.classGroup?.formation?.name ?? '';

  // --- Finances de la période sélectionnée, + delta vs période équivalente précédente ---
  const revenue = payments.filter((p) => inRange(p.date, period.from, period.to)).reduce((s, p) => s + p.amount, 0);
  const expensesInPeriod = expenses.filter((e) => inRange(e.date, period.from, period.to)).reduce((s, e) => s + e.amount, 0);
  const netIncome = revenue - expensesInPeriod;
  const netMarginPercent = revenue > 0 ? (netIncome / revenue) * 100 : 0;

  const prevRevenue = payments.filter((p) => inRange(p.date, period.prevFrom, period.prevTo)).reduce((s, p) => s + p.amount, 0);
  const prevExpenses = expenses.filter((e) => inRange(e.date, period.prevFrom, period.prevTo)).reduce((s, e) => s + e.amount, 0);
  const revenueDelta = revenue - prevRevenue;
  const expensesDelta = expensesInPeriod - prevExpenses;

  const activeStudents = students.filter((s) => !INACTIVE_STATUSES.includes(s.currentStatus)).length;
  const totalStudents = students.length;

  const totalToCollect = schedules.reduce((sum, s) => sum + s.remainingAmount, 0);
  const totalPaidAllTime = schedules.reduce((sum, s) => sum + s.paidAmount, 0);
  const recoveryRate =
    totalPaidAllTime + totalToCollect > 0 ? (totalPaidAllTime / (totalPaidAllTime + totalToCollect)) * 100 : 0;

  const lateSchedules = schedules.filter((s) => s.status === 'en_retard');
  const totalLateAmount = lateSchedules.reduce((sum, s) => sum + s.remainingAmount, 0);
  const totalLateInstallments = lateSchedules.reduce((count, s) => {
    const installments = s.installments as Installment[] | null;
    if (!installments) return count + 1;
    return count + installments.filter((i) => i.status === 'en_retard').length;
  }, 0);

  // --- Impayés par ancienneté (0-30/30-60/60+ jours de retard) ---
  const overdueBuckets: Record<'0-30' | '30-60' | '60+', number> = { '0-30': 0, '30-60': 0, '60+': 0 };
  const latePayments = lateSchedules.flatMap((s) => {
    const student = studentById.get(s.studentId);
    const installments = (s.installments as Installment[] | null) ?? [];
    return installments
      .filter((i) => i.status === 'en_retard')
      .map((i) => {
        const daysLate = daysBetween(now, new Date(i.dueDate));
        const bucket: '0-30' | '30-60' | '60+' = daysLate <= 30 ? '0-30' : daysLate <= 60 ? '30-60' : '60+';
        overdueBuckets[bucket] += i.amount;
        return {
          studentId: s.studentId,
          firstName: student?.firstName ?? '',
          lastName: student?.lastName ?? '',
          matricule: student?.matricule ?? '',
          formationName: formationNameFor(s.studentId),
          dueDate: i.dueDate,
          amount: i.amount,
        };
      });
  });
  const overdueByAge = (['0-30', '30-60', '60+'] as const).map((bucket) => ({ bucket, amount: overdueBuckets[bucket] }));

  // --- Échéances des 7 prochains jours ---
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingDue = schedules
    .flatMap((s) => {
      const student = studentById.get(s.studentId);
      const installments = (s.installments as Installment[] | null) ?? [];
      return installments
        .filter((i) => i.status === 'a_jour' && new Date(i.dueDate) <= in7Days)
        .map((i) => ({
          studentId: s.studentId,
          firstName: student?.firstName ?? '',
          lastName: student?.lastName ?? '',
          matricule: student?.matricule ?? '',
          formationName: formationNameFor(s.studentId),
          dueDate: i.dueDate,
          amount: i.amount,
        }));
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // --- Flux d'étudiants (période sélectionnée) ---
  const isEntry = (s: (typeof students)[number]) =>
    ENTRY_STATUSES.includes(s.currentStatus) || inRange(s.enrollmentDate, period.from, period.to);
  const isExit = (s: (typeof students)[number]) => INACTIVE_STATUSES.includes(s.currentStatus);

  const entries = students.filter(isEntry).length;
  const exits = students.filter(isExit).length;

  // --- Répartition par formation (fusion des anciens toCollectByFormation + studentFlow.byFormation) ---
  const formationBreakdown = formations.map((f) => {
    const inFormation = students.filter((s) => s.classGroup?.formationId === f.id);
    const studentIds = new Set(inFormation.map((s) => s.id));
    const resteAEncaisser = schedules
      .filter((s) => studentIds.has(s.studentId))
      .reduce((sum, s) => sum + s.remainingAmount, 0);
    const formationEntries = inFormation.filter(isEntry).length;
    const formationExits = inFormation.filter(isExit).length;

    return {
      formationId: f.id,
      name: f.name,
      entries: formationEntries,
      exits: formationExits,
      net: formationEntries - formationExits,
      effectif: inFormation.filter((s) => !INACTIVE_STATUSES.includes(s.currentStatus)).length,
      resteAEncaisser,
    };
  });

  // --- Dépenses par catégorie (période sélectionnée) ---
  const categoryTotals = new Map<string, number>();
  for (const e of expenses) {
    if (!inRange(e.date, period.from, period.to)) continue;
    categoryTotals.set(e.category, (categoryTotals.get(e.category) ?? 0) + e.amount);
  }
  const expensesByCategory = Array.from(categoryTotals.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  // --- Tendance financière 6 mois glissants (réutilise getFinanceSeries, déjà centerIds-aware) ---
  const financeRangeFrom = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const rawFinanceSeries = await getFinanceSeries(tx, orgId, { from: financeRangeFrom, to: now }, centerIds);
  const financeSeries = rawFinanceSeries.map((p) => ({ ...p, net: p.revenue - p.expenses }));

  // --- Dernières transactions (paiements + dépenses fusionnés) ---
  const recentTransactions = [
    ...payments.map((p) => {
      const student = studentById.get(p.studentId);
      return {
        id: p.id,
        type: 'payment' as const,
        label: student ? `${student.firstName} ${student.lastName}` : 'Étudiant',
        subtitle: `Paiement · ${new Date(p.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}`,
        date: p.date,
        amount: p.amount,
      };
    }),
    ...expenses.map((e) => ({
      id: e.id,
      type: 'expense' as const,
      label: e.title,
      subtitle: `Dépense · ${new Date(e.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}`,
      date: e.date,
      amount: e.amount,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  return {
    period: { from: period.from.toISOString(), to: period.to.toISOString(), label: period.label, prevLabel: period.prevLabel },
    activeStudents,
    totalStudents,
    studentFlow: { entries, exits, netBalance: entries - exits },
    revenue,
    revenueDelta,
    expenses: expensesInPeriod,
    expensesDelta,
    netIncome,
    netMarginPercent,
    recoveryRate,
    totalToCollect,
    totalLateAmount,
    totalLateInstallments,
    overdueByAge,
    upcomingDue,
    latePayments,
    formationBreakdown,
    expensesByCategory,
    financeSeries,
    recentTransactions,
  };
}
