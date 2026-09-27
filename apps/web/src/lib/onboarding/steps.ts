/**
 * Définition partagée (client + serveur) des étapes de l'assistant de configuration.
 * L'ordre du tableau est l'ordre du parcours ; la clé est persistée dans
 * Organization.onboardingStep / onboardingSkippedSteps.
 */
export const ONBOARDING_STEPS = [
  { key: 'welcome', label: 'Bienvenue', skippable: false },
  { key: 'centers', label: 'Centres', skippable: true },
  { key: 'formations', label: 'Formations', skippable: true },
  { key: 'classes', label: 'Classes', skippable: true },
  { key: 'users', label: 'Utilisateurs', skippable: true },
  { key: 'students', label: 'Étudiants', skippable: true },
  { key: 'summary', label: 'Récapitulatif', skippable: false },
] as const;

export type OnboardingStepKey = (typeof ONBOARDING_STEPS)[number]['key'];

export const ONBOARDING_STEP_KEYS = ONBOARDING_STEPS.map((s) => s.key) as [
  OnboardingStepKey,
  ...OnboardingStepKey[],
];

export const SKIPPABLE_STEP_KEYS = ONBOARDING_STEPS.filter((s) => s.skippable).map((s) => s.key);

export type OnboardingStatus = 'non_commence' | 'en_cours' | 'termine';

export function stepIndex(key: string | null | undefined): number {
  const index = ONBOARDING_STEPS.findIndex((s) => s.key === key);
  return index === -1 ? 0 : index;
}
