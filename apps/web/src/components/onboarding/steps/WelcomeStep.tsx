"use client";

import React from "react";
import { BadgeCheck, FileSpreadsheet, SkipForward, Sparkles, TimerReset } from "lucide-react";
import type { OnboardingStateDTO } from "@/lib/api/types";
import { ONBOARDING_STEPS } from "@/lib/onboarding/steps";

const STEP_HINTS: Record<string, string> = {
  appearance: "La couleur de votre espace",
  centers: "Vos sites de formation",
  formations: "Vos programmes, leur durée et leur coût",
  classes: "Vos cohortes, par formation et par centre",
  users: "Les comptes de votre équipe et leurs rôles",
  students: "Vos apprenants, saisis ou importés depuis Excel",
};

const fmtLimit = (n: number, noun: string) => (n === -1 ? `${noun} illimités` : `jusqu'à ${new Intl.NumberFormat("fr-FR").format(n)} ${noun}`);
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

const TIPS = [
  { icon: SkipForward, title: "Chaque étape est facultative", text: "Passez-la et complétez-la plus tard depuis les pages de l’application." },
  { icon: TimerReset, title: "Quittez à tout moment", text: "Votre progression est enregistrée : l’assistant reprendra où vous l’avez laissé." },
  { icon: FileSpreadsheet, title: "Vos fichiers Excel sont les bienvenus", text: "Importez-les aux étapes Formations, Classes et Étudiants." },
];

export function WelcomeStep({ state }: { state: OnboardingStateDTO }) {
  const configurable = ONBOARDING_STEPS.filter((s) => s.key in STEP_HINTS);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3 pt-2">
        <div className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <Sparkles className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Bienvenue, {state.organizationName} !</h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Configurons ensemble votre espace Warriors Management en quelques minutes. Nous allons créer les données essentielles
          dont vous aurez besoin au quotidien.
        </p>
      </div>

      <ol className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {configurable.map((step, i) => (
          <li key={step.key} className="rounded-xl border border-border bg-card p-4">
            <span className="text-xs font-semibold text-primary">Étape {i + 1}</span>
            <p className="text-sm font-semibold text-foreground mt-1">{step.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{STEP_HINTS[step.key]}</p>
          </li>
        ))}
      </ol>

      {/* Bon à savoir : abonnement mis en avant, puis les trois règles de l'assistant */}
      <div className="grid gap-3 lg:grid-cols-4">
        {state.limits && (
          <div className="rounded-2xl bg-primary text-primary-foreground p-5 flex flex-col gap-3 lg:row-span-1">
            <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <BadgeCheck className="w-5 h-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wider opacity-80">Votre abonnement</p>
              <p className="text-xl font-bold mt-0.5">{titleCase(state.limits.planName)}</p>
              <p className="text-sm opacity-90 mt-1">
                {capitalize(fmtLimit(state.limits.maxCenters, "centres"))}, {fmtLimit(state.limits.maxStudents, "étudiants")}
              </p>
            </div>
          </div>
        )}
        {TIPS.map((tip) => (
          <div key={tip.title} className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3">
            <span className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
              <tip.icon className="w-5 h-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">{tip.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{tip.text}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
