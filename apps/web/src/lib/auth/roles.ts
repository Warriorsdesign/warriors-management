export const ROLES = {
  ADMIN: 'ADMIN',
  GESTIONNAIRE: 'GESTIONNAIRE',
  COMPTABLE: 'COMPTABLE',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

const ALL_ROLES = [ROLES.ADMIN, ROLES.GESTIONNAIRE, ROLES.COMPTABLE] as const;

/**
 * Matrice de permissions par ressource. Voir Phase 4 du plan pour la justification
 * de chaque cellule (notamment: COMPTABLE n'a aucun accès à Users, GESTIONNAIRE/COMPTABLE
 * n'ont aucun accès à Organization).
 */
export const PERMISSIONS = {
  students: { read: ALL_ROLES, write: [ROLES.ADMIN, ROLES.GESTIONNAIRE] },
  classes: { read: ALL_ROLES, write: [ROLES.ADMIN, ROLES.GESTIONNAIRE] },
  formations: { read: ALL_ROLES, write: [ROLES.ADMIN, ROLES.GESTIONNAIRE] },
  centers: { read: ALL_ROLES, write: [ROLES.ADMIN, ROLES.GESTIONNAIRE] },
  payments: { read: ALL_ROLES, write: [ROLES.ADMIN, ROLES.COMPTABLE] },
  expenses: { read: ALL_ROLES, write: [ROLES.ADMIN, ROLES.COMPTABLE] },
  users: { read: [ROLES.ADMIN, ROLES.GESTIONNAIRE], write: [ROLES.ADMIN] },
  organization: { read: [ROLES.ADMIN], write: [ROLES.ADMIN] },
  dashboard: { read: ALL_ROLES },
} as const;
