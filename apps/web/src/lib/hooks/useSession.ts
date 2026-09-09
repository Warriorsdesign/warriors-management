import useSWR from 'swr';
import { PERMISSIONS } from '@/lib/auth/roles';
import { apiFetch, revalidateResource } from '@/lib/api/client';
import type { SessionUser, SessionOrganization, UpdateOwnProfileInput, ChangePasswordInput } from '@/lib/api/types';
import type { Role } from '@/lib/types/enums';

interface SessionResponse {
  user: SessionUser;
  organization: SessionOrganization;
}

export function useSession() {
  const { data, error, isLoading, mutate } = useSWR<SessionResponse>('/api/auth/me');

  return {
    user: data?.user,
    organization: data?.organization,
    roles: data?.user?.roles ?? [],
    isLoading,
    error,
    mutate,
  };
}

/** Vérifie si le rôle courant a accès (read/write) à une ressource, selon la matrice serveur. */
export function useCan(resource: keyof typeof PERMISSIONS, action: 'read' | 'write'): boolean {
  const { roles } = useSession();
  const permission = PERMISSIONS[resource] as Record<string, readonly Role[] | undefined>;
  const allowed = permission[action];
  if (!allowed) return false;
  return roles.some((r) => allowed.includes(r));
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
