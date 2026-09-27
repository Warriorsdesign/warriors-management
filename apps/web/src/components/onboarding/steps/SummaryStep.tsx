"use client";

import React from "react";
import { Building, CheckCircle2, GraduationCap, Layers, UserPlus, Users } from "lucide-react";
import type { OnboardingStateDTO } from "@/lib/api/types";
import { ONBOARDING_STEPS, type OnboardingStepKey } from "@/lib/onboarding/steps";

const ITEMS: { key: keyof OnboardingStateDTO["counts"]; step: OnboardingStepKey; label: string; icon: React.ElementType }[] = [
  { key: "centers", step: "centers", label: "Centres", icon: Building },
  { key: "formations", step: "formations", label: "Formations", icon: Layers },
  { key: "classes", step: "classes", label: "Classes", icon: Users },
  { key: "users", step: "users", label: "Utilisateurs", icon: UserPlus },
  { key: "students", step: "students", label: "Étudiants", icon: GraduationCap },
];

export function SummaryStep({ state, skippedSteps }: { state: OnboardingStateDTO; skippedSteps: OnboardingStepKey[] }) {
  const skippedLabels = ONBOARDING_STEPS.filter((s) => skippedSteps.includes(s.key)).map((s) => s.label);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3 pt-2">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Votre espace est prêt</h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Voici le récapitulatif de la configuration de {state.organizationName}. Vous pourrez compléter ces données à tout moment.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {ITEMS.map((item) => (
          <div key={item.key} className="rounded-xl border border-border bg-card p-4 text-center">
            <item.icon className="w-5 h-5 text-primary mx-auto" />
            <p className="text-2xl font-bold text-foreground mt-2">{new Intl.NumberFormat("fr-FR").format(state.counts[item.key])}</p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>

      {skippedLabels.length > 0 && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
          Étape(s) ignorée(s) : <span className="font-medium">{skippedLabels.join(", ")}</span>. Vous pourrez les compléter depuis
          les pages correspondantes, ou relancer l’assistant depuis Paramètres &gt; Configuration.
        </div>
      )}
    </div>
  );
}
