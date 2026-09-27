import { z } from 'zod';
import { ONBOARDING_STEP_KEYS, SKIPPABLE_STEP_KEYS } from '@/lib/onboarding/steps';

const skippedStepsSchema = z
  .array(z.enum(ONBOARDING_STEP_KEYS))
  .refine((steps) => steps.every((s) => (SKIPPABLE_STEP_KEYS as readonly string[]).includes(s)), {
    message: 'Cette étape ne peut pas être ignorée.',
  })
  .transform((steps) => Array.from(new Set(steps)));

export const updateOnboardingSchema = z.object({
  step: z.enum(ONBOARDING_STEP_KEYS).optional(),
  skippedSteps: skippedStepsSchema.optional(),
});

export const completeOnboardingSchema = z.object({
  skippedSteps: skippedStepsSchema.default([]),
});
