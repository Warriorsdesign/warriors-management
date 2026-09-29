import type { Metadata } from "next";
import { Check } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/landing/SiteChrome";
import { SignupForm } from "@/components/landing/SignupForm";
import { TRIAL_DAYS } from "@/lib/config/contact";

export const metadata: Metadata = {
  title: `Essai gratuit de ${TRIAL_DAYS} jours · Warriors Management`,
  description: "Créez l'espace de votre centre de formation et découvrez votre tableau de bord avec vos propres données.",
};

const STEPS = [
  "Votre espace est créé immédiatement.",
  "Un assistant vous guide : centres, formations, classes, équipe.",
  "Vos fichiers Excel existants s’importent en quelques minutes.",
];

export default function EssaiPage() {
  return (
    <div className="lp min-h-screen flex flex-col">
      <SiteHeader solid />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16 grid lg:grid-cols-[1fr_1.1fr] gap-12 items-start">
        <div className="lg:pt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Essai gratuit de {TRIAL_DAYS} jours</p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
            Créez l’espace de votre établissement.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Pendant {TRIAL_DAYS} jours, testez tout avec vos vraies données. À la fin de l’essai, vous choisissez un forfait
            ou vous en restez là : rien n’est prélevé automatiquement.
          </p>
          <ul className="mt-8 space-y-3">
            {STEPS.map((s) => (
              <li key={s} className="flex items-start gap-3 text-foreground">
                <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" /> {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative lp-card shadow-xl shadow-black/5">
          <SignupForm />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
