import useSWR from 'swr';
import { apiFetch } from '@/lib/api/client';

export interface AdminUser {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string | null;
  isSuperAdmin: boolean;
  status: string;
  createdAt: string;
}

interface AdminSessionResponse {
  user: AdminUser;
}

export function useAdminSession() {
  const { data, error, isLoading, mutate } = useSWR<AdminSessionResponse>(
    '/api/admin/auth/me'
  );

  return {
    adminUser: data?.user,
    isLoading,
    error,
    mutate,
  };
}

export async function adminLogout() {
  await apiFetch('/api/admin/auth/logout', { method: 'POST' });
  window.location.href = '/admin/login';
}
