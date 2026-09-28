import useSWR from 'swr';
import { apiFetch, apiFetcher } from '@/lib/api/client';

export interface RolePermission {
  id?: string;
  resource: string;
  canRead: boolean;
  canWrite: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  /** Rôle système adapté par l'organisation (GESTIONNAIRE, COMPTABLE) : nom figé, réinitialisable. */
  systemKey: string | null;
  /** ADMIN : tous les droits, non modifiable. */
  locked: boolean;
  permissions: RolePermission[];
  userCount: number;
  createdAt: string;
}

export function useRoles() {
  const { data, error, isLoading, mutate } = useSWR<Role[]>('/api/roles', apiFetcher);

  return {
    roles: data || [],
    isLoading,
    error,
    mutate
  };
}

export async function createRole(data: { name: string; description?: string; permissions: RolePermission[] }): Promise<Role> {
  return await apiFetch('/api/roles', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateRole(id: string, data: Partial<{ name: string; description: string; permissions: RolePermission[] }>): Promise<Role> {
  return await apiFetch(`/api/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

/** Rétablit les réglages d'origine d'un rôle système. */
export async function resetRole(id: string): Promise<Role> {
  return await apiFetch(`/api/roles/${id}/reset`, { method: 'POST' });
}

export async function deleteRole(id: string): Promise<void> {
  await apiFetch(`/api/roles/${id}`, {
    method: 'DELETE'
  });
}
