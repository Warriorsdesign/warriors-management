import useSWR from 'swr';
import { apiFetch, revalidateResource, toQueryString } from '@/lib/api/client';
import type { FormationDTO, CreateFormationInput, UpdateFormationInput } from '@/lib/api/types';

const KEY = '/api/formations';

export function useFormations(params?: { search?: string; centerId?: string[] }) {
  const key = `${KEY}${toQueryString({ search: params?.search, centerId: params?.centerId })}`;
  const { data, error, isLoading } = useSWR<{ data: FormationDTO[] }>(key);
  return { formations: data?.data ?? [], error, isLoading };
}

export async function createFormation(input: CreateFormationInput) {
  const formation = await apiFetch<FormationDTO>(KEY, { method: 'POST', body: JSON.stringify(input) });
  await revalidateResource(KEY);
  return formation;
}

export async function updateFormation(id: string, input: UpdateFormationInput) {
  const formation = await apiFetch<FormationDTO>(`${KEY}/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
  await revalidateResource(KEY);
  return formation;
}

export async function deleteFormation(id: string) {
  const result = await apiFetch<{ success: true }>(`${KEY}/${id}`, { method: 'DELETE' });
  await revalidateResource(KEY);
  return result;
}

export async function renameFormationLevel(formationId: string, levelId: string, name: string) {
  const formation = await apiFetch<FormationDTO>(`${KEY}/${formationId}/levels/${levelId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
  await revalidateResource(KEY);
  return formation;
}
