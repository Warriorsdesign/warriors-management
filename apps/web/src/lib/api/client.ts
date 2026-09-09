import { mutate as globalMutate } from 'swr';

export class ApiClientError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Fetch wrapper pour toutes les routes /api/*. Inclut toujours le cookie (credentials),
 * parse le JSON, et lève ApiClientError sur toute réponse non-2xx avec le message/code
 * réels renvoyés par le serveur (voir lib/api/errors.ts côté backend).
 *
 * 401 (session invalide/expirée) est géré globalement ici par une redirection vers /login,
 * sauf si on y est déjà - ce qui évite une boucle de redirection sur un login refusé.
 */
export async function apiFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string>) };
  if (init?.body) headers['Content-Type'] = 'application/json';

  const res = await fetch(path, { ...init, headers, credentials: 'include' });

  const text = await res.text();
  const body = text ? JSON.parse(text) : {};

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new ApiClientError(res.status, body.error ?? 'Une erreur est survenue.', body.code, body.details);
  }

  return body as T;
}

export const apiFetcher = <T = unknown>(path: string): Promise<T> => apiFetch<T>(path);

/**
 * Revalide toutes les clés SWR dont la clé (une URL, potentiellement avec query string)
 * commence par `prefix`. Nécessaire car mutate('/api/students') seul ne toucherait pas
 * une clé comme '/api/students?search=jean&page=2'.
 */
export function revalidateResource(prefix: string): Promise<unknown> {
  return globalMutate((key) => typeof key === 'string' && key.startsWith(prefix), undefined, {
    revalidate: true,
  });
}

export function toQueryString(
  params: Record<string, string | number | boolean | string[] | undefined>
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    if (Array.isArray(value)) {
      value.forEach((v) => search.append(key, v));
    } else {
      search.append(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}
