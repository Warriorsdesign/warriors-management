import { and, eq, gte, inArray, lte } from 'drizzle-orm';
import type { TenantClient } from '@/lib/db-types';
import { classGroups, expenses, formationCenters, formations, payments, students } from '@/lib/db/schema';

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
  const [studentRows, paymentRows, expenseRows] = await Promise.all([
    centerIds.length
      ? tx.select({ student: students }).from(students)
          .innerJoin(classGroups, eq(classGroups.id, students.classId))
          .where(and(eq(students.organizationId, orgId), inArray(classGroups.centerId, centerIds)))
          .then((rows) => rows.map((row) => row.student))
      : tx.select().from(students).where(eq(students.organizationId, orgId)),
    centerIds.length
      ? tx.select({ payment: payments }).from(payments)
          .innerJoin(students, eq(students.id, payments.studentId))
          .innerJoin(classGroups, eq(classGroups.id, students.classId))
          .where(and(eq(payments.organizationId, orgId), inArray(classGroups.centerId, centerIds)))
          .then((rows) => rows.map((row) => row.payment))
      : tx.select().from(payments).where(eq(payments.organizationId, orgId)),
    tx.select().from(expenses).where(and(
      eq(expenses.organizationId, orgId),
      ...(centerIds.length ? [inArray(expenses.centerId, centerIds)] : []),
    )),
  ]);
  const totalActiveStudents = studentRows.filter((s) => !INACTIVE_STATUSES.includes(s.currentStatus)).length;
  const newStudentsInRange = studentRows.filter((s) => inRange(s.enrollmentDate, range)).length;
  const totalRevenueInRange = paymentRows.filter((p) => inRange(p.date, range)).reduce((sum, p) => sum + p.amount, 0);
  const totalExpensesInRange = expenseRows.filter((e) => inRange(e.date, range)).reduce((sum, e) => sum + e.amount, 0);

  return {
    totalActiveStudents,
    newStudentsInRange,
    totalRevenueInRange,
    totalExpensesInRange,
    netIncomeInRange: totalRevenueInRange - totalExpensesInRange,
  };
}

export async function getFormationReports(
  tx: TenantClient,
  orgId: string,
  range: DateRange,
  centerIds: string[] = [],
  formationScope: string[] | null = null
) {
  const formationRows = formationScope?.length
    ? await tx.selectDistinct({ id: formations.id, name: formations.name }).from(formations)
        .innerJoin(formationCenters, eq(formationCenters.formationId, formations.id))
        .where(and(eq(formations.organizationId, orgId), inArray(formationCenters.centerId, formationScope)))
    : await tx.select({ id: formations.id, name: formations.name }).from(formations)
        .where(eq(formations.organizationId, orgId));
  const [studentRows, paymentRows] = await Promise.all([
    tx.select({ student: students, formationId: classGroups.formationId }).from(students)
      .innerJoin(classGroups, eq(classGroups.id, students.classId))
      .where(and(
        eq(students.organizationId, orgId),
        ...(centerIds.length ? [inArray(classGroups.centerId, centerIds)] : []),
      )),
    tx.select({ payment: payments, formationId: classGroups.formationId }).from(payments)
      .innerJoin(students, eq(students.id, payments.studentId))
      .innerJoin(classGroups, eq(classGroups.id, students.classId))
      .where(and(
        eq(payments.organizationId, orgId),
        ...(centerIds.length ? [inArray(classGroups.centerId, centerIds)] : []),
      )),
  ]);

  return formationRows.map((formation) => {
    const enrolled = studentRows.filter((row) => row.formationId === formation.id).map((row) => row.student);
    const studentIds = new Set(enrolled.map((student) => student.id));
    const dropoutCount = enrolled.filter((student) => student.currentStatus === 'abandonne').length;
    const revenueInRange = paymentRows
      .filter((row) => row.formationId === formation.id && studentIds.has(row.payment.studentId) && inRange(row.payment.date, range))
      .reduce((sum, row) => sum + row.payment.amount, 0);
    return {
      formationId: formation.id,
      name: formation.name,
      studentCount: enrolled.length,
      dropoutCount,
      dropoutRate: enrolled.length > 0 ? dropoutCount / enrolled.length : 0,
      revenueInRange,
    };
  });
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
}

export async function getFinanceSeries(tx: TenantClient, orgId: string, range: DateRange, centerIds: string[] = []) {
  const now = new Date();
  const from = range.from ?? new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const to = range.to ?? now;
  const [paymentRows, expenseRows] = await Promise.all([
    centerIds.length
      ? tx.select({ payment: payments }).from(payments)
          .innerJoin(students, eq(students.id, payments.studentId))
          .innerJoin(classGroups, eq(classGroups.id, students.classId))
          .where(and(
            eq(payments.organizationId, orgId),
            gte(payments.date, from),
            lte(payments.date, to),
            inArray(classGroups.centerId, centerIds),
          )).then((rows) => rows.map((row) => row.payment))
      : tx.select().from(payments).where(and(eq(payments.organizationId, orgId), gte(payments.date, from), lte(payments.date, to))),
    tx.select().from(expenses).where(and(
      eq(expenses.organizationId, orgId),
      gte(expenses.date, from),
      lte(expenses.date, to),
      ...(centerIds.length ? [inArray(expenses.centerId, centerIds)] : []),
    )),
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
    revenue: paymentRows.filter((p) => monthKey(p.date) === key).reduce((sum, p) => sum + p.amount, 0),
    expenses: expenseRows.filter((e) => monthKey(e.date) === key).reduce((sum, e) => sum + e.amount, 0),
  }));
}
