import useSWR from 'swr';
import { apiFetch, revalidateResource } from '@/lib/api/client';
import type { OrganizationDTO, UpdateOrganizationInput } from '@/lib/api/types';

const KEY = '/api/organization';

export function useOrganization() {
  const { data, error, isLoading } = useSWR<OrganizationDTO>(KEY);
  return { organization: data, error, isLoading };
}

export async function updateOrganization(input: UpdateOrganizationInput) {
  const organization = await apiFetch<OrganizationDTO>(KEY, { method: 'PATCH', body: JSON.stringify(input) });
  await revalidateResource(KEY);
  await revalidateResource('/api/auth/me');
  return organization;
}
