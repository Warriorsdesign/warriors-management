import { apiFetch, ApiClientError, revalidateResource } from '@/lib/api/client';
import type { ImportAnalysisDTO, ImportCommitDTO, ImportType } from '@/lib/api/types';

/** Ressources SWR à rafraîchir après un import, pour que les pages existantes affichent les données. */
const REVALIDATE: Record<ImportType, string[]> = {
  formations: ['/api/formations'],
  classes: ['/api/classes', '/api/formations'],
  students: ['/api/students', '/api/classes', '/api/dashboard', '/api/payments', '/api/reports'],
};

function fileForm(file: File, extra: Record<string, string> = {}) {
  const form = new FormData();
  form.append('file', file);
  for (const [key, value] of Object.entries(extra)) form.append(key, value);
  return form;
}

/** Téléchargement d'un fichier binaire renvoyé par l'API (modèle, rapport d'erreurs). */
async function downloadFrom(path: string, filename: string, init?: RequestInit) {
  const res = await fetch(path, { ...init, credentials: 'include' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiClientError(res.status, body.error ?? 'Téléchargement impossible.', body.code);
  }
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadImportTemplate(type: ImportType) {
  return downloadFrom(`/api/import/${type}/template`, `modele-import-${type}.xlsx`);
}

export function downloadImportErrorReport(type: ImportType, file: File) {
  return downloadFrom(`/api/import/${type}/report`, `erreurs-import-${type}.xlsx`, { method: 'POST', body: fileForm(file) });
}

export function analyzeImport(type: ImportType, file: File) {
  return apiFetch<ImportAnalysisDTO>(`/api/import/${type}/analyze`, { method: 'POST', body: fileForm(file) });
}

export async function commitImport(type: ImportType, file: File, analysis: ImportAnalysisDTO) {
  const result = await apiFetch<ImportCommitDTO>(`/api/import/${type}/commit`, {
    method: 'POST',
    body: fileForm(file, { fileHash: analysis.fileHash, expectedValidRows: String(analysis.validRows) }),
  });
  await Promise.all([...REVALIDATE[type], '/api/onboarding', '/api/subscriptions'].map((key) => revalidateResource(key)));
  return result;
}
