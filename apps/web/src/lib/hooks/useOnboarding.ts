import { useRef } from 'react';
import useSWR from 'swr';
import { apiFetch, revalidateResource } from '@/lib/api/client';
import type { OnboardingStateDTO } from '@/lib/api/types';
import type { OnboardingStepKey } from '@/lib/onboarding/steps';

const KEY = '/api/onboarding';

export function useOnboarding(enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<OnboardingStateDTO>(enabled ? KEY : null);
  // revalidateResource (lib/api/client.ts) vide le cache SWR avant de recharger : sans ce
  // dernier état connu, l'assistant repasserait par l'écran de chargement et démonterait
  // l'étape en cours, perdant la saisie de l'utilisateur.
  const last = useRef<OnboardingStateDTO | undefined>(undefined);
  if (data) last.current = data;
  const state = data ?? last.current;
  return { state, error, isLoading: isLoading && !state, mutate };
}

export async function saveOnboardingProgress(input: { step?: OnboardingStepKey; skippedSteps?: OnboardingStepKey[] }) {
  const state = await apiFetch<OnboardingStateDTO>(KEY, { method: 'PATCH', body: JSON.stringify(input) });
  await Promise.all([revalidateResource(KEY), revalidateResource('/api/auth/me')]);
  return state;
}

export async function completeOnboarding(skippedSteps: OnboardingStepKey[]) {
  await apiFetch<{ success: true }>(`${KEY}/complete`, { method: 'POST', body: JSON.stringify({ skippedSteps }) });
  await Promise.all([revalidateResource(KEY), revalidateResource('/api/auth/me')]);
}
