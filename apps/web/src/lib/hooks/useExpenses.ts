import useSWR from 'swr';
import { apiFetch, revalidateResource, toQueryString } from '@/lib/api/client';
import type { ExpenseDTO, CreateExpenseInput, UpdateExpenseInput, Paginated } from '@/lib/api/types';
import type { ExpenseCategory } from '@/lib/types/enums';

const KEY = '/api/expenses';

export interface UseExpensesParams {
  search?: string;
  category?: ExpenseCategory;
  centerId?: string[];
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export function useExpenses(params: UseExpensesParams) {
  const key = `${KEY}${toQueryString(params as Record<string, string | number | undefined>)}`;
  const { data, error, isLoading } = useSWR<Paginated<ExpenseDTO>>(key);
  return { data: data?.data ?? [], meta: data?.meta, error, isLoading };
}

export async function createExpense(input: CreateExpenseInput) {
  const expense = await apiFetch<ExpenseDTO>(KEY, { method: 'POST', body: JSON.stringify(input) });
  await revalidateResource(KEY);
  return expense;
}

export async function updateExpense(id: string, input: UpdateExpenseInput) {
  const expense = await apiFetch<ExpenseDTO>(`${KEY}/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
  await revalidateResource(KEY);
  return expense;
}

export async function deleteExpense(id: string) {
  const result = await apiFetch<{ success: true }>(`${KEY}/${id}`, { method: 'DELETE' });
  await revalidateResource(KEY);
  return result;
}
