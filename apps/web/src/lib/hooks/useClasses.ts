import useSWR from 'swr';
import { apiFetch, revalidateResource, toQueryString } from '@/lib/api/client';
import type { ClassDTO, CreateClassInput, UpdateClassInput } from '@/lib/api/types';

const KEY = '/api/classes';

export function useClasses(params?: { formationId?: string; centerId?: string[] }) {
  const key = `${KEY}${toQueryString({ formationId: params?.formationId, centerId: params?.centerId })}`;
  const { data, error, isLoading } = useSWR<{ data: ClassDTO[] }>(key);
  return { classes: data?.data ?? [], error, isLoading };
}

export async function createClass(input: CreateClassInput) {
  const classGroup = await apiFetch<ClassDTO>(KEY, { method: 'POST', body: JSON.stringify(input) });
  await revalidateResource(KEY);
  return classGroup;
}

export async function updateClass(id: string, input: UpdateClassInput) {
  const classGroup = await apiFetch<ClassDTO>(`${KEY}/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
  await revalidateResource(KEY);
  return classGroup;
}

export async function deleteClass(id: string) {
  const result = await apiFetch<{ success: true }>(`${KEY}/${id}`, { method: 'DELETE' });
  await revalidateResource(KEY);
  return result;
}
