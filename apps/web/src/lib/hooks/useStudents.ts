import useSWR from 'swr';
import { apiFetch, revalidateResource, toQueryString } from '@/lib/api/client';
import type {
  StudentListItemDTO, StudentDetailDTO, CreateStudentInput, CreateStudentResult,
  UpdateStudentInput, RecordStudentPaymentInput, PaymentMutationResult, Paginated,
} from '@/lib/api/types';
import type { StudentStatus } from '@/lib/types/enums';

const KEY = '/api/students';

export interface UseStudentsParams {
  search?: string;
  formationId?: string[];
  status?: StudentStatus[];
  centerId?: string[];
  page?: number;
  pageSize?: number;
}

export function useStudents(params: UseStudentsParams | null) {
  const key = params
    ? `${KEY}${toQueryString({
        search: params.search,
        formationId: params.formationId,
        status: params.status,
        centerId: params.centerId,
        page: params.page,
        pageSize: params.pageSize,
      })}`
    : null;
  const { data, error, isLoading } = useSWR<Paginated<StudentListItemDTO>>(key);
  return { data: data?.data ?? [], meta: data?.meta, error, isLoading };
}

export function useStudent(id: string | undefined | null) {
  const { data, error, isLoading, mutate } = useSWR<StudentDetailDTO>(id ? `${KEY}/${id}` : null);
  return { student: data, error, isLoading, mutate };
}

export async function createStudent(input: CreateStudentInput) {
  const result = await apiFetch<CreateStudentResult>(KEY, { method: 'POST', body: JSON.stringify(input) });
  await revalidateResource(KEY);
  return result;
}

export async function updateStudent(id: string, input: UpdateStudentInput) {
  const student = await apiFetch<StudentListItemDTO>(`${KEY}/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
  await revalidateResource(KEY);
  return student;
}

export async function deleteStudent(id: string) {
  const result = await apiFetch<{ success: true }>(`${KEY}/${id}`, { method: 'DELETE' });
  await revalidateResource(KEY);
  return result;
}

export async function changeStudentClass(id: string, classId: string) {
  const student = await apiFetch<StudentListItemDTO>(`${KEY}/${id}/class`, {
    method: 'PATCH',
    body: JSON.stringify({ classId }),
  });
  await revalidateResource(KEY);
  return student;
}

export async function changeStudentStatus(id: string, status: StudentStatus, motif?: string) {
  const student = await apiFetch<StudentListItemDTO>(`${KEY}/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, motif }),
  });
  await revalidateResource(KEY);
  return student;
}

export async function changeStudentLevel(id: string, levelId: string) {
  const student = await apiFetch<StudentListItemDTO>(`${KEY}/${id}/level`, {
    method: 'PATCH',
    body: JSON.stringify({ levelId }),
  });
  await revalidateResource(KEY);
  return student;
}

export async function recordStudentPayment(id: string, input: RecordStudentPaymentInput) {
  const result = await apiFetch<PaymentMutationResult>(`${KEY}/${id}/payments`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  await revalidateResource(KEY);
  await revalidateResource('/api/payments');
  return result;
}
