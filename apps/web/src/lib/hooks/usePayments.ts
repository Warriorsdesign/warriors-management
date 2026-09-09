import useSWR from 'swr';
import { apiFetch, revalidateResource, toQueryString } from '@/lib/api/client';
import type { PaymentDTO, CreatePaymentInput, UpdatePaymentInput, PaymentMutationResult, Paginated } from '@/lib/api/types';

const KEY = '/api/payments';

export interface UsePaymentsParams {
  studentId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export function usePayments(params: UsePaymentsParams) {
  const key = `${KEY}${toQueryString(params as Record<string, string | number | undefined>)}`;
  const { data, error, isLoading } = useSWR<Paginated<PaymentDTO>>(key);
  return { data: data?.data ?? [], meta: data?.meta, error, isLoading };
}

// Un paiement modifie aussi le student embarqué (schedule) - on revalide les deux préfixes,
// ce ne sont pas des ressources distinctes mais deux vues du même Payment/PaymentSchedule.
async function revalidatePaymentRelated() {
  await revalidateResource(KEY);
  await revalidateResource('/api/students');
}

export async function createPayment(input: CreatePaymentInput) {
  const result = await apiFetch<PaymentMutationResult>(KEY, { method: 'POST', body: JSON.stringify(input) });
  await revalidatePaymentRelated();
  return result;
}

export async function updatePayment(id: string, input: UpdatePaymentInput) {
  const result = await apiFetch<PaymentMutationResult>(`${KEY}/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
  await revalidatePaymentRelated();
  return result;
}

export async function deletePayment(id: string) {
  const result = await apiFetch<{ success: true; schedule: PaymentMutationResult['schedule'] }>(`${KEY}/${id}`, {
    method: 'DELETE',
  });
  await revalidatePaymentRelated();
  return result;
}
