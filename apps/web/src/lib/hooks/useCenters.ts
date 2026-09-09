import useSWR from 'swr';
import { apiFetch, revalidateResource } from '@/lib/api/client';
import type { CenterDTO, CreateCenterInput, UpdateCenterInput } from '@/lib/api/types';

const KEY = '/api/centers';

export function useCenters() {
  const { data, error, isLoading } = useSWR<{ data: CenterDTO[] }>(KEY);
  return { centers: data?.data ?? [], error, isLoading };
}

export async function createCenter(input: CreateCenterInput) {
  const center = await apiFetch<CenterDTO>(KEY, { method: 'POST', body: JSON.stringify(input) });
  await revalidateResource(KEY);
  return center;
}

export async function updateCenter(id: string, input: UpdateCenterInput) {
  const center = await apiFetch<CenterDTO>(`${KEY}/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
  await revalidateResource(KEY);
  return center;
}

export async function deleteCenter(id: string) {
  const result = await apiFetch<{ success: true }>(`${KEY}/${id}`, { method: 'DELETE' });
  await revalidateResource(KEY);
  return result;
}
