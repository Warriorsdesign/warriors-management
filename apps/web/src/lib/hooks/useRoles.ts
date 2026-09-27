import useSWR from 'swr';
import { apiFetch, apiFetcher } from '@/lib/api/client';
import { useState, useCallback } from 'react';

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
  permissions: RolePermission[];
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

export async function deleteRole(id: string): Promise<void> {
  await apiFetch(`/api/roles/${id}`, {
    method: 'DELETE'
  });
}
