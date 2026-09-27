"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import type { OnboardingStateDTO } from "@/lib/api/types";
import { ONBOARDING_STEPS } from "@/lib/onboarding/steps";

const STEP_HINTS: Record<string, string> = {
  centers: "Vos sites de formation",
  formations: "Vos programmes, leur durée et leur coût",
  classes: "Vos cohortes, par formation et par centre",
  users: "Les comptes de votre équipe et leurs rôles",
  students: "Vos apprenants, saisis ou importés depuis Excel",
};

const fmtLimit = (n: number, noun: string) => (n === -1 ? `${noun} illimités` : `jusqu'à ${new Intl.NumberFormat("fr-FR").format(n)} ${noun}`);

export function WelcomeStep({ state }: { state: OnboardingStateDTO }) {
  const configurable = ONBOARDING_STEPS.filter((s) => s.key in STEP_HINTS);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3 pt-2">
        <div className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
          <Sparkles className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Bienvenue, {state.organizationName} !</h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Configurons ensemble votre espace Warriors Management en quelques minutes. Nous allons créer les données essentielles
          dont vous aurez besoin au quotidien.
        </p>
      </div>

      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {configurable.map((step, i) => (
          <li key={step.key} className="rounded-xl border border-border bg-card p-4">
            <span className="text-xs font-semibold text-primary">Étape {i + 1}</span>
            <p className="text-sm font-semibold text-foreground mt-1">{step.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{STEP_HINTS[step.key]}</p>
          </li>
        ))}
      </ol>

      <div className="rounded-xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground space-y-1.5">
        <p>• Chaque étape peut être <span className="font-medium text-foreground">passée</span> et complétée plus tard depuis les pages de l’application.</p>
        <p>• Vous pouvez <span className="font-medium text-foreground">quitter à tout moment</span> : votre progression est enregistrée et l’assistant reprendra où vous l’avez laissé.</p>
        <p>• Vous avez déjà vos données dans Excel ? Vous pourrez les <span className="font-medium text-foreground">importer</span> aux étapes Formations, Classes et Étudiants.</p>
        {state.limits && (
          <p>
            • Votre abonnement <span className="font-medium text-foreground">{state.limits.planName}</span> inclut{" "}
            {fmtLimit(state.limits.maxCenters, "centres")} et {fmtLimit(state.limits.maxStudents, "étudiants")}.
          </p>
        )}
      </div>
    </div>
  );
}
