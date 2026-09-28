import useSWR from 'swr';
import { apiFetch, revalidateResource } from '@/lib/api/client';
import type { SessionUser, SessionOrganization, SessionPermissions, UpdateOwnProfileInput, ChangePasswordInput } from '@/lib/api/types';
import { studentFinanceLevel, type PermissionAction, type PermissionResource, type StudentFinanceLevel } from '@/lib/auth/permissionCatalog';

interface SessionResponse {
  user: SessionUser;
  organization: SessionOrganization;
  permissions: SessionPermissions;
}

export function useSession() {
  const { data, error, isLoading, mutate } = useSWR<SessionResponse>('/api/auth/me');

  return {
    user: data?.user,
    organization: data?.organization,
    roles: data?.user?.roles ?? [],
    permissions: data?.permissions,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Vérifie si l'utilisateur a accès (read/write) à une ressource, d'après les permissions
 * effectives renvoyées par /api/auth/me (rôles de l'organisation). Faux tant que la session
 * charge : l'interface n'affiche rien de sensible par défaut. Le serveur reste la barrière.
 */
export function useCan(resource: PermissionResource, action: PermissionAction): boolean {
  const { permissions } = useSession();
  return permissions?.[resource]?.[action] ?? false;
}

/** Visibilité des finances d'un étudiant : aucune, statut seulement, détail complet. */
export function useStudentFinanceLevel(): StudentFinanceLevel {
  const { permissions } = useSession();
  return permissions ? studentFinanceLevel(permissions) : 'none';
}

export async function updateOwnProfile(input: UpdateOwnProfileInput) {
  const user = await apiFetch<SessionUser>('/api/users/me', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  await revalidateResource('/api/auth/me');
  return user;
}

export async function changeOwnPassword(input: ChangePasswordInput) {
  return apiFetch<{ success: true }>('/api/users/me/password', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
