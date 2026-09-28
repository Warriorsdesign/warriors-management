/**
 * Modèle de l'éditeur de rôle : organise le catalogue de permissions comme le menu de
 * l'application (Pilotage / Gestion / Finances / Administration) et traduit les choix de
 * l'administrateur ("Aucun / Lecture / Écriture", sous-options) en permissions cohérentes.
 */
import {
  emptyGrants,
  normalizeGrants,
  studentFinanceLevel,
  type PermissionGrants,
  type PermissionResource,
  type StudentFinanceLevel,
} from './permissionCatalog';

export type AccessLevel = 'none' | 'read' | 'write';

export interface ModuleDef {
  resource: PermissionResource;
  label: string;
  /** Niveaux proposés (l'écriture n'existe pas pour les modules en lecture seule). */
  levels: AccessLevel[];
  hint?: string;
}

export interface SectionDef {
  title: string;
  modules: ModuleDef[];
}

export const EDITOR_SECTIONS: SectionDef[] = [
  {
    title: 'Pilotage',
    modules: [{ resource: 'dashboard', label: 'Tableau de bord', levels: ['none', 'read'] }],
  },
  {
    title: 'Gestion',
    modules: [
      { resource: 'students', label: 'Étudiants', levels: ['none', 'read', 'write'], hint: 'Écriture : inscrire (frais et échéancier compris), modifier, changer de classe ou de statut.' },
      { resource: 'formations', label: 'Formations', levels: ['none', 'read', 'write'] },
      { resource: 'classes', label: 'Classes', levels: ['none', 'read', 'write'] },
    ],
  },
  {
    title: 'Finances',
    modules: [
      { resource: 'payments', label: 'Paiements', levels: ['none', 'read', 'write'] },
      { resource: 'expenses', label: 'Dépenses', levels: ['none', 'read', 'write'] },
      { resource: 'reports', label: 'Rapports', levels: ['none', 'read'] },
    ],
  },
  {
    title: 'Administration',
    modules: [
      { resource: 'centers', label: 'Centres', levels: ['none', 'read'], hint: 'Création et modification des centres : administrateur uniquement.' },
      { resource: 'users', label: 'Utilisateurs', levels: ['none', 'read', 'write'], hint: 'Écriture : créer et modifier des comptes dans ses centres, avec des rôles qui ne dépassent pas les siens. La gestion des rôles reste réservée à l’administrateur.' },
    ],
  },
];

export const ACCESS_LABELS: Record<AccessLevel, string> = { none: 'Aucun', read: 'Lecture', write: 'Écriture' };

export const FINANCE_LEVEL_LABELS: Record<StudentFinanceLevel, string> = {
  none: 'Aucune',
  status: 'Statut seulement',
  full: 'Détail complet',
};

export function accessLevel(grants: PermissionGrants, resource: PermissionResource): AccessLevel {
  if (grants[resource].write) return 'write';
  if (grants[resource].read) return 'read';
  return 'none';
}

function clone(grants: PermissionGrants): PermissionGrants {
  return Object.fromEntries(Object.entries(grants).map(([k, v]) => [k, { ...v }])) as PermissionGrants;
}

/** Change le niveau d'un module ; les sous-options devenues impossibles sont retirées. */
export function setAccess(grants: PermissionGrants, resource: PermissionResource, level: AccessLevel): PermissionGrants {
  const next = clone(grants);
  next[resource] = { read: level !== 'none', write: level === 'write' };
  return normalizeGrants(next);
}

/** Visibilité des finances sur la fiche et la liste des étudiants. */
export function setStudentFinance(grants: PermissionGrants, level: StudentFinanceLevel): PermissionGrants {
  const next = clone(grants);
  next['students.finance_status'] = { read: level !== 'none', write: false };
  next['students.finance_detail'] = { read: level === 'full', write: false };
  return normalizeGrants(next);
}

/** Encaissement depuis la fiche : active automatiquement le détail financier requis. */
export function setCollect(grants: PermissionGrants, enabled: boolean): PermissionGrants {
  const next = enabled ? setStudentFinance(grants, 'full') : clone(grants);
  next['students.collect'] = { read: false, write: enabled };
  return normalizeGrants(next);
}

export function setDashboardFinance(grants: PermissionGrants, enabled: boolean): PermissionGrants {
  const next = clone(grants);
  next['dashboard.finance'] = { read: enabled, write: false };
  return normalizeGrants(next);
}

export function grantsFromRows(rows: { resource: string; canRead: boolean; canWrite: boolean }[]): PermissionGrants {
  const grants = emptyGrants();
  for (const row of rows) {
    if (row.resource in grants) grants[row.resource as PermissionResource] = { read: row.canRead, write: row.canWrite };
  }
  return normalizeGrants(grants);
}

/** Entrées du menu que verra un utilisateur ayant ce rôle (aperçu en direct). */
export function menuPreview(grants: PermissionGrants): { section: string; items: string[] }[] {
  const sections = EDITOR_SECTIONS.map((s) => ({
    section: s.title,
    items: s.modules.filter((m) => grants[m.resource].read).map((m) => m.label),
  }));
  const admin = sections.find((s) => s.section === 'Administration');
  if (admin) admin.items.push('Paramètres');
  return sections.filter((s) => s.items.length > 0);
}

/** Résumé des accès sensibles affiché sous l'éditeur. */
export function sensitiveSummary(grants: PermissionGrants): { level: 'money' | 'status' | 'none'; details: string[] } {
  const details: string[] = [];
  if (grants.payments.read) details.push('la liste des paiements');
  if (grants.expenses.read) details.push('les dépenses');
  if (grants.reports.read) details.push('les rapports financiers');
  if (grants['dashboard.finance'].read) details.push('les indicateurs financiers du tableau de bord');
  if (grants['students.finance_detail'].read) details.push('les montants et échéanciers des étudiants');
  if (details.length > 0) return { level: 'money', details };
  if (studentFinanceLevel(grants) === 'status') return { level: 'status', details: [] };
  return { level: 'none', details: [] };
}
