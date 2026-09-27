"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useOnboarding } from "@/lib/hooks/useOnboarding";
import { ImportWizard } from "@/components/import/ImportWizard";

const STATUS_LABEL = { non_commence: "Non commencée", en_cours: "En cours", termine: "Terminée" } as const;

/** Onglet Paramètres > Configuration : relance de l'assistant et import Excel hors onboarding. */
export function ConfigurationSettings() {
  const { state } = useOnboarding();

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in duration-300">
      <div className="border-b border-border pb-4">
        <h2 className="text-xl font-semibold text-foreground">Configuration & import</h2>
        <p className="text-sm text-muted-foreground mt-1">Assistant de configuration initiale et import de données depuis Excel.</p>
      </div>

      <section className="rounded-xl border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Assistant de configuration</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Statut : {state ? STATUS_LABEL[state.status] : "..."}
              {state?.completedAt && ` le ${new Date(state.completedAt).toLocaleDateString("fr-FR")}`}
              {state && state.skippedSteps.length > 0 && ` · ${state.skippedSteps.length} étape(s) ignorée(s)`}
            </p>
          </div>
        </div>
        <Link
          href="/onboarding"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-secondary transition-colors"
        >
          {state?.status === "termine" ? "Relancer l'assistant" : "Reprendre l'assistant"}
        </Link>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Importer des données depuis Excel</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Importez dans l’ordre : formations, puis classes, puis étudiants. Chaque fichier est analysé avant tout enregistrement.
          </p>
        </div>
        <ImportWizard types={["formations", "classes", "students"]} />
      </section>
    </div>
  );
}
