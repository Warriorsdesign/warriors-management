/**
 * Catalogue des permissions attribuables à un rôle, partagé entre le serveur et l'interface
 * (aucun accès à la base ici).
 *
 * Trois niveaux :
 *  - modules (students, payments, ...) : présence dans le menu et accès aux pages / API ;
 *  - actions (read / write) sur chaque module ;
 *  - données sensibles transversales ("students.finance_detail", "dashboard.finance", ...) :
 *    blocs d'information visibles à l'intérieur d'autres modules.
 *
 * Le rôle ADMIN a tous les droits par construction (voir lib/auth/permissions.ts) : certaines
 * actions (création de centres, gestion des utilisateurs, organisation) ne sont attribuables
 * à aucun autre rôle et sont donc absentes (false) de ce catalogue.
 */

export type PermissionAction = 'read' | 'write';

export const PERMISSION_RESOURCES = [
  'dashboard',
  'dashboard.finance',
  'students',
  'students.finance_status',
  'students.finance_detail',
  'students.collect',
  'formations',
  'classes',
  'centers',
  'payments',
  'expenses',
  'reports',
  'users',
  'organization',
] as const;

export type PermissionResource = (typeof PERMISSION_RESOURCES)[number];

export interface PermissionGrant {
  read: boolean;
  write: boolean;
}

export type PermissionGrants = Record<PermissionResource, PermissionGrant>;
export type PartialPermissionGrants = Partial<Record<PermissionResource, Partial<PermissionGrant>>>;

/** Actions attribuables à un rôle autre qu'ADMIN. */
export const GRANTABLE: Record<PermissionResource, PermissionGrant> = {
  dashboard: { read: true, write: false },
  'dashboard.finance': { read: true, write: false },
  students: { read: true, write: true },
  'students.finance_status': { read: true, write: false },
  'students.finance_detail': { read: true, write: false },
  'students.collect': { read: false, write: true },
  formations: { read: true, write: true },
  classes: { read: true, write: true },
  centers: { read: true, write: false }, // création/modification : ADMIN uniquement
  payments: { read: true, write: true },
  expenses: { read: true, write: true },
  reports: { read: true, write: false },
  users: { read: true, write: true }, // comptes : rôles attribués plafonnés aux droits de l'auteur ; gestion des rôles : ADMIN uniquement
  organization: { read: false, write: false }, // paramètres de l'organisation : ADMIN uniquement
};

/** Sous-permission -> permission requise ("resource:action"). */
const REQUIRES: Partial<Record<PermissionResource, [PermissionResource, PermissionAction][]>> = {
  'dashboard.finance': [['dashboard', 'read']],
  'students.finance_status': [['students', 'read']],
  'students.finance_detail': [['students', 'read'], ['students.finance_status', 'read']],
  'students.collect': [['students', 'read'], ['students.finance_detail', 'read']],
};

export function emptyGrants(): PermissionGrants {
  return Object.fromEntries(PERMISSION_RESOURCES.map((r) => [r, { read: false, write: false }])) as PermissionGrants;
}

export function fullGrants(): PermissionGrants {
  return Object.fromEntries(PERMISSION_RESOURCES.map((r) => [r, { read: true, write: true }])) as PermissionGrants;
}

/**
 * Rend un jeu de permissions cohérent : retire les actions non attribuables, l'écriture
 * implique la lecture, une sous-permission sans sa permission parente est retirée, et le
 * détail financier implique le statut. Appliqué à l'enregistrement d'un rôle ET à la
 * résolution (défense en profondeur si la base contient une combinaison incohérente).
 */
export function normalizeGrants(input: PartialPermissionGrants): PermissionGrants {
  const out = emptyGrants();
  for (const resource of PERMISSION_RESOURCES) {
    const g = input[resource];
    if (!g) continue;
    const write = Boolean(g.write) && GRANTABLE[resource].write;
    const read = (Boolean(g.read) || write) && GRANTABLE[resource].read;
    out[resource] = { read, write };
  }
  // Implication montante : le détail financier donne le statut.
  if (out['students.finance_detail'].read) out['students.finance_status'].read = true;
  // Dépendances : retirées tant qu'une passe change encore quelque chose (chaînes courtes).
  let changed = true;
  while (changed) {
    changed = false;
    for (const [resource, deps] of Object.entries(REQUIRES) as [PermissionResource, [PermissionResource, PermissionAction][]][]) {
      const g = out[resource];
      if (!g.read && !g.write) continue;
      if (deps.every(([dep, action]) => out[dep][action])) continue;
      out[resource] = { read: false, write: false };
      changed = true;
    }
  }
  return out;
}

/** Union de plusieurs jeux de permissions (utilisateur ayant plusieurs rôles). */
export function mergeGrants(list: PermissionGrants[]): PermissionGrants {
  const out = emptyGrants();
  for (const grants of list) {
    for (const resource of PERMISSION_RESOURCES) {
      out[resource] = {
        read: out[resource].read || grants[resource].read,
        write: out[resource].write || grants[resource].write,
      };
    }
  }
  return out;
}

/** Lignes RolePermission (seules les ressources accordées sont stockées). */
export function grantsToRows(grants: PermissionGrants): { resource: PermissionResource; canRead: boolean; canWrite: boolean }[] {
  return PERMISSION_RESOURCES.filter((r) => grants[r].read || grants[r].write).map((resource) => ({
    resource,
    canRead: grants[resource].read,
    canWrite: grants[resource].write,
  }));
}

export function rowsToGrants(rows: { resource: string; canRead: boolean; canWrite: boolean }[]): PermissionGrants {
  const partial: PartialPermissionGrants = {};
  for (const row of rows) {
    if (!(PERMISSION_RESOURCES as readonly string[]).includes(row.resource)) continue;
    partial[row.resource as PermissionResource] = { read: row.canRead, write: row.canWrite };
  }
  return normalizeGrants(partial);
}

// --- Visibilité financière d'un étudiant ---

export type StudentFinanceLevel = 'none' | 'status' | 'full';

export function studentFinanceLevel(grants: PermissionGrants): StudentFinanceLevel {
  if (grants['students.finance_detail'].read) return 'full';
  if (grants['students.finance_status'].read) return 'status';
  return 'none';
}

// --- Rôles système modifiables par organisation ---

export const SYSTEM_ROLE_KEYS = ['GESTIONNAIRE', 'COMPTABLE'] as const;
export type SystemRoleKey = (typeof SYSTEM_ROLE_KEYS)[number];

/**
 * Réglages d'origine des rôles système. Chaque organisation en reçoit une copie qu'elle peut
 * adapter ; "Rétablir les réglages d'origine" recopie ces valeurs.
 * À garder synchronisé avec prisma/migrations-sql/2026-09-role-permissions.sql.
 */
export const SYSTEM_ROLE_TEMPLATES: Record<SystemRoleKey, { description: string; grants: PartialPermissionGrants }> = {
  GESTIONNAIRE: {
    description: 'Gestion pédagogique : inscriptions, classes et formations, sans accès à la trésorerie.',
    grants: {
      dashboard: { read: true },
      students: { write: true },
      'students.finance_status': { read: true },
      formations: { write: true },
      classes: { write: true },
      centers: { read: true },
      users: { read: true },
    },
  },
  COMPTABLE: {
    description: 'Encaissements, dépenses et rapports financiers.',
    grants: {
      dashboard: { read: true },
      'dashboard.finance': { read: true },
      students: { read: true },
      'students.finance_status': { read: true },
      'students.finance_detail': { read: true },
      'students.collect': { write: true },
      formations: { read: true },
      classes: { read: true },
      centers: { read: true },
      payments: { write: true },
      expenses: { write: true },
      reports: { read: true },
    },
  },
};

export function isSystemRoleKey(value: string | null | undefined): value is SystemRoleKey {
  return (SYSTEM_ROLE_KEYS as readonly string[]).includes(value ?? '');
}
