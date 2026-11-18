export const ROLES = {
  ADMIN: 'ADMIN',
  GESTIONNAIRE: 'GESTIONNAIRE',
  COMPTABLE: 'COMPTABLE',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Les permissions ne sont plus figées par rôle dans le code : elles sont lues en base par
// organisation (lib/auth/permissions.ts). Catalogue et réglages d'origine des rôles système :
// lib/auth/permissionCatalog.ts.
