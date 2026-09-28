import type { StudentFinanceLevel } from '@/lib/auth/permissionCatalog';

/**
 * Filtrage serveur des données financières d'un étudiant selon le niveau de visibilité du
 * rôle (permissions "students.finance_status" / "students.finance_detail"). Masquer un bloc
 * dans l'interface ne suffit pas : ce qui n'est pas autorisé n'est jamais envoyé.
 *  - none   : ni statut, ni montant, ni échéancier, ni paiement ;
 *  - status : uniquement le statut de paiement (à jour / en retard / soldé) ;
 *  - full   : tout.
 */

type ScheduleSummary = { status: string; remainingAmount: number };

/** Résumé affiché dans la liste des étudiants. */
export function redactScheduleSummary(schedule: ScheduleSummary | null | undefined, level: StudentFinanceLevel) {
  if (!schedule || level === 'none') return null;
  if (level === 'status') return { status: schedule.status };
  return schedule;
}

/** Fiche étudiant : échéancier et paiements réservés au détail complet. */
export function redactStudentFinance<S extends { status: string }, P>(
  schedule: S | null,
  payments: P[],
  level: StudentFinanceLevel
): { schedule: S | null; payments: P[]; paymentStatus: string | null; financeLevel: StudentFinanceLevel } {
  return {
    schedule: level === 'full' ? schedule : null,
    payments: level === 'full' ? payments : [],
    paymentStatus: level === 'none' ? null : schedule?.status ?? null,
    financeLevel: level,
  };
}
