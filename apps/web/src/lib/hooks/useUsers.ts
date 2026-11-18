import useSWR from 'swr';
import { apiFetch, revalidateResource } from '@/lib/api/client';
import type { UserDTO, CreateUserInput, UpdateUserInput, CreateUserResult } from '@/lib/api/types';

const KEY = '/api/users';

export function useUsers() {
  const { data, error, isLoading } = useSWR<{ data: UserDTO[] }>(KEY);
  return { users: data?.data ?? [], error, isLoading };
}

export async function createUser(input: CreateUserInput) {
  const result = await apiFetch<CreateUserResult>(KEY, { method: 'POST', body: JSON.stringify(input) });
  await revalidateResource(KEY);
  return result;
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const user = await apiFetch<UserDTO>(`${KEY}/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
  await revalidateResource(KEY);
  return user;
}

export async function deleteUser(id: string) {
  const result = await apiFetch<{ success: true }>(`${KEY}/${id}`, { method: 'DELETE' });
  await revalidateResource(KEY);
  return result;
}

/** Réservé aux administrateurs : renvoie un mot de passe provisoire à transmettre à l'utilisateur. */
export async function resetUserPassword(id: string) {
  return apiFetch<{ matricule: string | null; provisionalPassword: string }>(`${KEY}/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
