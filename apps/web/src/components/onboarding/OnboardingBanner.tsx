"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useSession, useCan } from "@/lib/hooks/useSession";
import { ONBOARDING_STEPS, stepIndex } from "@/lib/onboarding/steps";

/**
 * Rappel persistant tant que l'assistant de configuration n'est pas terminé ("Reprendre plus
 * tard"), réservé aux utilisateurs habilités à configurer l'organisation.
 */
export function OnboardingBanner() {
  const { organization } = useSession();
  const canConfigure = useCan("organization", "write");

  if (!canConfigure || !organization?.onboardingStatus || organization.onboardingStatus === "termine") return null;

  const index = stepIndex(organization.onboardingStep);
  return (
    <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
      <div className="flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-primary shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">Terminez la configuration de votre organisation</p>
          <p className="text-xs text-muted-foreground">
            {organization.onboardingStatus === "en_cours"
              ? `Étape ${index + 1} sur ${ONBOARDING_STEPS.length} : ${ONBOARDING_STEPS[index].label}`
              : "Centres, formations, classes, utilisateurs et étudiants : laissez-vous guider."}
          </p>
        </div>
      </div>
      <Link
        href="/onboarding"
        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm"
      >
        {organization.onboardingStatus === "en_cours" ? "Reprendre" : "Commencer"} <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
