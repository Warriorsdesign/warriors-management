"use client";
import { SWRConfig } from 'swr';
import { apiFetcher, ApiClientError } from '@/lib/api/client';

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: apiFetcher,
        revalidateOnFocus: true,
        shouldRetryOnError: (err) => !(err instanceof ApiClientError) || err.status >= 500,
      }}
    >
      {children}
    </SWRConfig>
  );
}
