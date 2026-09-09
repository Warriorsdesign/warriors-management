import { addWeeks, addMonths } from 'date-fns';
import type { TenantClient } from '@/lib/db';
import { ApiError } from '@/lib/api/errors';

export type IntervalType =
  | '1_semaine' | '2_semaines' | '3_semaines'
  | '1_mois' | '2_mois' | '3_mois' | '4_mois';

export type InstallmentStatus = 'a_jour' | 'en_retard' | 'solde';

export interface Installment {
  dueDate: string; // ISO date, immutable une fois créée
  plannedAmount: number; // immutable - montant initialement dû pour cette échéance
  amount: number; // mutable - montant restant dû (0 une fois soldée)
  status: InstallmentStatus;
}

export interface ScheduleTotals {
  paidAmount: number;
  remainingAmount: number;
  status: InstallmentStatus;
}

export interface InstallmentPlanInput {
  totalCost: number;
  registrationFee: number;
  installmentsCount: number;
  installmentInterval: IntervalType;
  enrollmentDate: Date | string;
}

function addInterval(date: Date, interval: IntervalType, times: number): Date {
  const [amountStr, unit] = interval.split('_');
  const amount = parseInt(amountStr, 10) * times;
  return unit.startsWith('semaine') ? addWeeks(date, amount) : addMonths(date, amount);
}

function computeInstallmentStatus(amount: number, dueDate: string, now: Date): InstallmentStatus {
  if (amount <= 0) return 'solde';
  return new Date(dueDate) < now ? 'en_retard' : 'a_jour';
}

/**
 * Construit le plan d'échéances immuable (dueDate/plannedAmount) à partir des paramètres
 * d'inscription. Les frais d'inscription sont modélisés comme l'échéance #1 (dueDate =
 * enrollmentDate) - voir la note de décision dans le plan Phase 4 : cela unifie le
 * paiement d'inscription et les paiements ultérieurs dans un seul mécanisme de replay.
 */
export function buildInstallmentPlan(input: InstallmentPlanInput, now: Date = new Date()): Installment[] {
  const enrollmentDate = new Date(input.enrollmentDate);
  const installments: Installment[] = [];

  if (input.registrationFee > 0) {
    const dueDate = enrollmentDate.toISOString();
    installments.push({
      dueDate,
      plannedAmount: input.registrationFee,
      amount: input.registrationFee,
      status: computeInstallmentStatus(input.registrationFee, dueDate, now),
    });
  }

  const remaining = Math.max(0, input.totalCost - input.registrationFee);
  const count = Math.max(0, input.installmentsCount);
  if (count > 0) {
    const baseAmount = Math.round(remaining / count);
    let allocated = 0;
    for (let i = 0; i < count; i++) {
      const isLast = i === count - 1;
      const plannedAmount = isLast ? remaining - allocated : baseAmount;
      allocated += plannedAmount;
      const dueDate = addInterval(enrollmentDate, input.installmentInterval, i + 1).toISOString();
      installments.push({
        dueDate,
        plannedAmount,
        amount: plannedAmount,
        status: computeInstallmentStatus(plannedAmount, dueDate, now),
      });
    }
  }

  return installments;
}

/**
 * Applique un paiement au plan d'échéances : parcourt les échéances par ordre chronologique,
 * solde celles qui peuvent l'être, répartit un paiement partiel/débordant sur plusieurs
 * échéances, et ajoute une échéance supplémentaire si le paiement dépasse le plan total.
 * Contrairement à l'ancienne logique client, `plannedAmount` n'est jamais muté - seul
 * `amount` (restant dû) l'est - ce qui rend l'opération inversable via rebuildScheduleForStudent.
 */
export function applyPaymentToInstallments(
  installments: Installment[],
  amountToApply: number,
  now: Date = new Date()
): Installment[] {
  const sorted = [...installments].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  let remaining = amountToApply;

  const applied = sorted.map((installment) => {
    if (remaining <= 0 || installment.amount <= 0) return installment;
    const paid = Math.min(remaining, installment.amount);
    remaining -= paid;
    const newAmount = installment.amount - paid;
    return {
      ...installment,
      amount: newAmount,
      status: computeInstallmentStatus(newAmount, installment.dueDate, now),
    };
  });

  if (remaining > 0) {
    const lastDueDate = applied.length > 0 ? applied[applied.length - 1].dueDate : now.toISOString();
    const dueDate = addMonths(new Date(lastDueDate), 1).toISOString();
    applied.push({ dueDate, plannedAmount: remaining, amount: 0, status: 'solde' });
  }

  return applied;
}

export function computeScheduleTotals(installments: Installment[], totalCost: number): ScheduleTotals {
  const paidAmount = installments.reduce((sum, i) => sum + (i.plannedAmount - i.amount), 0);
  const remainingAmount = Math.max(0, totalCost - paidAmount);
  const hasLate = installments.some((i) => i.status === 'en_retard');
  const status: InstallmentStatus = remainingAmount === 0 ? 'solde' : hasLate ? 'en_retard' : 'a_jour';
  return { paidAmount, remainingAmount, status };
}

export function buildInitialSchedule(input: InstallmentPlanInput, now: Date = new Date()) {
  const installments = buildInstallmentPlan(input, now);
  const totals = computeScheduleTotals(installments, input.totalCost);
  return { totalAmount: input.totalCost, installments, ...totals };
}

/**
 * Source de vérité unique pour l'état d'un échéancier : régénère le plan de base à partir
 * des paramètres immuables stockés (registrationFee/installmentsCount/installmentInterval),
 * puis rejoue tous les paiements du student (du plus ancien au plus récent). Déterministe et
 * idempotent - appelée par les 3 points d'entrée de paiement pour garantir qu'aucune
 * désynchronisation n'est possible.
 */
export async function rebuildScheduleForStudent(tx: TenantClient, studentId: string, orgId: string) {
  const student = await tx.student.findFirst({ where: { id: studentId, organizationId: orgId } });
  if (!student) throw new ApiError(404, 'Student not found', 'NOT_FOUND');

  const schedule = await tx.paymentSchedule.findFirst({ where: { studentId, organizationId: orgId } });
  if (!schedule) throw new ApiError(404, 'Payment schedule not found', 'NOT_FOUND');

  const payments = await tx.payment.findMany({
    where: { studentId, organizationId: orgId },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
  });

  const now = new Date();
  let installments = buildInstallmentPlan(
    {
      totalCost: schedule.totalAmount,
      registrationFee: schedule.registrationFee,
      installmentsCount: schedule.installmentsCount,
      installmentInterval: schedule.installmentInterval as IntervalType,
      enrollmentDate: student.enrollmentDate,
    },
    now
  );

  for (const payment of payments) {
    installments = applyPaymentToInstallments(installments, payment.amount, now);
  }

  const totals = computeScheduleTotals(installments, schedule.totalAmount);

  return tx.paymentSchedule.update({
    where: { id: schedule.id },
    data: {
      installments: installments as unknown as object,
      paidAmount: totals.paidAmount,
      remainingAmount: totals.remainingAmount,
      status: totals.status,
    },
  });
}
