"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Loader2, LogOut, ShieldCheck, SkipForward } from "lucide-react";
import { ApiClientError } from "@/lib/api/client";
import { useOnboarding, saveOnboardingProgress, completeOnboarding } from "@/lib/hooks/useOnboarding";
import { ONBOARDING_STEPS, SKIPPABLE_STEP_KEYS, stepIndex, type OnboardingStepKey } from "@/lib/onboarding/steps";
import type { OnboardingStateDTO } from "@/lib/api/types";
import { useUIStore } from "@/lib/store/useUIStore";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { primaryButtonClass, secondaryButtonClass } from "./shared";
import { WelcomeStep } from "./steps/WelcomeStep";
import { CentersStep } from "./steps/CentersStep";
import { FormationsStep } from "./steps/FormationsStep";
import { ClassesStep } from "./steps/ClassesStep";
import { UsersStep } from "./steps/UsersStep";
import { StudentsStep } from "./steps/StudentsStep";
import { SummaryStep } from "./steps/SummaryStep";

const COUNT_BY_STEP: Partial<Record<OnboardingStepKey, keyof OnboardingStateDTO["counts"]>> = {
  centers: "centers",
  formations: "formations",
  classes: "classes",
  users: "users",
  students: "students",
};

function isSkippable(key: OnboardingStepKey) {
  return (SKIPPABLE_STEP_KEYS as readonly string[]).includes(key);
}

export function OnboardingWizard() {
  const router = useRouter();
  const { state, error, isLoading } = useOnboarding();
  const [step, setStep] = useState<OnboardingStepKey>("welcome");
  const [skipped, setSkipped] = useState<OnboardingStepKey[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  // Tant que l'étape enregistrée n'est pas appliquée, rien n'est affiché : sinon l'écran
  // "Bienvenue" apparaîtrait un instant et un clic partirait de la mauvaise étape.
  const [isReady, setIsReady] = useState(false);

  // Reprise : l'étape et les étapes ignorées viennent de la base, une seule fois au chargement.
  useEffect(() => {
    if (!state || isReady) return;
    setStep(state.step ?? "welcome");
    setSkipped(state.skippedSteps);
    setIsReady(true);
    if (state.status === "non_commence") saveOnboardingProgress({ step: state.step ?? "welcome" }).catch(() => undefined);
  }, [state, isReady]);

  if (error) {
    const forbidden = error instanceof ApiClientError && error.status === 403;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-bold text-foreground">{forbidden ? "Accès réservé" : "Une erreur est survenue"}</h1>
          <p className="text-sm text-muted-foreground">
            {forbidden
              ? "La configuration de l'organisation est réservée aux administrateurs."
              : "Impossible de charger l'assistant de configuration."}
          </p>
          <Link href="/" className={primaryButtonClass}>Accéder à mon espace</Link>
        </div>
      </div>
    );
  }

  if (isLoading || !state || !isReady) {
    return (
      <div className="min-h-screen bg-background p-6 lg:p-12 space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const index = stepIndex(step);
  const current = ONBOARDING_STEPS[index];
  const isLast = index === ONBOARDING_STEPS.length - 1;
  const countKey = COUNT_BY_STEP[step];
  const hasItems = countKey ? state.counts[countKey] > 0 : true;
  // L'utilisateur connecté compte déjà pour 1 : l'étape Utilisateurs est "vide" tant qu'il est seul.
  const stepIsEmpty = step === "users" ? state.counts.users <= 1 : !hasItems;
  const progress = Math.round((index / (ONBOARDING_STEPS.length - 1)) * 100);

  const persist = async (nextStep: OnboardingStepKey, nextSkipped: OnboardingStepKey[]) => {
    setIsSaving(true);
    try {
      await saveOnboardingProgress({ step: nextStep, skippedSteps: nextSkipped });
      return true;
    } catch (err) {
      useUIStore.getState().showToast(err instanceof ApiClientError ? err.message : "Impossible d'enregistrer la progression.", "error");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const goTo = async (target: OnboardingStepKey, nextSkipped = skipped) => {
    setSkipped(nextSkipped);
    setStep(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
    await persist(target, nextSkipped);
  };

  const handleNext = () => {
    const nextSkipped = isSkippable(step)
      ? stepIsEmpty
        ? Array.from(new Set([...skipped, step]))
        : skipped.filter((s) => s !== step)
      : skipped;
    goTo(ONBOARDING_STEPS[index + 1].key, nextSkipped);
  };

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      await completeOnboarding(skipped);
      router.push("/");
      router.refresh();
    } catch (err) {
      useUIStore.getState().showToast(err instanceof ApiClientError ? err.message : "Une erreur est survenue.", "error");
      setIsSaving(false);
    }
  };

  const handleLater = async () => {
    if (await persist(step, skipped)) router.push("/");
  };

  const handleSkipAll = async () => {
    const empty = ONBOARDING_STEPS.filter((s) => {
      if (!s.skippable) return false;
      const key = COUNT_BY_STEP[s.key];
      return s.key === "users" ? state.counts.users <= 1 : key ? state.counts[key] === 0 : false;
    }).map((s) => s.key);
    setSkipped(empty);
    setIsSaving(true);
    try {
      await completeOnboarding(empty);
      router.push("/");
      router.refresh();
    } catch (err) {
      useUIStore.getState().showToast(err instanceof ApiClientError ? err.message : "Une erreur est survenue.", "error");
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">Configuration de {state.organizationName}</p>
              <p className="text-xs text-muted-foreground">Étape {index + 1} sur {ONBOARDING_STEPS.length} · {current.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {state.status !== "termine" && !isLast && (
              <button type="button" onClick={() => setIsLeaveOpen(true)} className="hidden sm:inline-flex text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 transition-colors">
                Passer la configuration
              </button>
            )}
            <button type="button" onClick={handleLater} disabled={isSaving} className={secondaryButtonClass}>
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Reprendre plus tard</span>
            </button>
          </div>
        </div>
        <div className="h-1 bg-secondary">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 flex-1 space-y-8">
        <nav aria-label="Étapes" className="overflow-x-auto">
          <ol className="flex items-center gap-2 min-w-max">
            {ONBOARDING_STEPS.map((s, i) => {
              const isCurrent = s.key === step;
              const isSkipped = skipped.includes(s.key) && !isCurrent;
              const isDone = i < index && !isSkipped;
              return (
                <li key={s.key} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => goTo(s.key)}
                    disabled={isSaving || isCurrent}
                    className={cn(
                      "flex items-center gap-2 rounded-full pl-1 pr-3 py-1 text-xs font-medium transition-all",
                      isCurrent ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-secondary text-muted-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold",
                        isCurrent ? "bg-primary-foreground/20" : isDone ? "bg-emerald-100 text-emerald-700" : isSkipped ? "bg-amber-100 text-amber-700" : "bg-secondary"
                      )}
                    >
                      {isDone ? <Check className="w-3.5 h-3.5" /> : isSkipped ? <SkipForward className="w-3 h-3" /> : i + 1}
                    </span>
                    {s.label}
                  </button>
                  {i < ONBOARDING_STEPS.length - 1 && <span className="w-4 h-px bg-border" />}
                </li>
              );
            })}
          </ol>
        </nav>

        {state.status === "termine" && !isLast && (
          <p className="text-sm text-muted-foreground bg-secondary/40 border border-border rounded-md px-4 py-2">
            Votre organisation est déjà configurée : utilisez l’assistant pour compléter vos données ou importer un fichier Excel.
          </p>
        )}

        <main key={step} className="animate-fade-in-up">
          {step === "welcome" && <WelcomeStep state={state} />}
          {step === "centers" && <CentersStep limits={state.limits} />}
          {step === "formations" && <FormationsStep />}
          {step === "classes" && <ClassesStep />}
          {step === "users" && <UsersStep />}
          {step === "students" && <StudentsStep limits={state.limits} studentCount={state.counts.students} />}
          {step === "summary" && <SummaryStep state={state} skippedSteps={skipped} />}
        </main>
      </div>

      <footer className="sticky bottom-0 z-30 bg-background/90 backdrop-blur-md border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => goTo(ONBOARDING_STEPS[index - 1].key)}
            disabled={index === 0 || isSaving}
            className={cn(secondaryButtonClass, index === 0 && "invisible")}
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          {isLast ? (
            <button type="button" onClick={handleFinish} disabled={isSaving} className={primaryButtonClass}>
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />} Accéder à mon espace <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" onClick={handleNext} disabled={isSaving} className={stepIsEmpty && current.skippable ? secondaryButtonClass : primaryButtonClass}>
              {stepIsEmpty && current.skippable ? (
                <>Passer cette étape <SkipForward className="w-4 h-4" /></>
              ) : (
                <>{step === "welcome" ? "Commencer" : "Continuer"} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          )}
        </div>
      </footer>

      <Modal isOpen={isLeaveOpen} onClose={() => setIsLeaveOpen(false)} title="Passer la configuration ?">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            L’assistant ne s’affichera plus à la connexion. Les données déjà créées sont conservées et vous pourrez le relancer
            à tout moment depuis <span className="font-medium text-foreground">Paramètres &gt; Configuration</span>.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsLeaveOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Continuer la configuration
            </button>
            <button type="button" onClick={handleSkipAll} disabled={isSaving} className={primaryButtonClass}>
              Oui, passer la configuration
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
