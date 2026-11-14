"use client";

import { Check, LayoutDashboard, Users } from "lucide-react";
import { THEMES, type ThemeKey } from "@/lib/config/themes";
import { cn } from "@/lib/utils";

/** Pastilles des 6 couleurs d'application (Paramètres > Apparence et assistant de configuration). */
export function ThemePicker({ value, onChange, disabled }: { value: ThemeKey; onChange: (key: ThemeKey) => void; disabled?: boolean }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3" role="radiogroup" aria-label="Couleur principale">
      {THEMES.map((t) => {
        const active = value === t.key;
        return (
          <button
            key={t.key}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(t.key)}
            className={cn(
              "group flex flex-col items-center gap-2 rounded-xl border p-3 transition-all disabled:opacity-60",
              active ? "border-foreground/30 bg-secondary/40" : "border-border bg-card hover:border-foreground/20"
            )}
          >
            <span
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-105",
                active && "ring-2 ring-offset-2 ring-offset-card"
              )}
              style={{ background: t.primary, ["--tw-ring-color" as string]: t.primary }}
            >
              {active && <Check className="w-5 h-5 text-white" aria-hidden="true" />}
            </span>
            <span className={cn("text-xs", active ? "font-semibold text-foreground" : "text-muted-foreground")}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Aperçu non interactif : suit la couleur appliquée (variables posées sur toute l'application). */
export function ThemePreview() {
  return (
    <div className="rounded-xl border border-border bg-background p-4 flex flex-col sm:flex-row gap-4" aria-hidden="true">
      <div className="sm:w-44 space-y-1">
        <span className="flex items-center gap-2 rounded-md px-3 py-2 text-sm bg-primary-soft text-primary font-semibold">
          <LayoutDashboard className="w-4 h-4" /> Tableau de bord
        </span>
        <span className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" /> Étudiants
        </span>
      </div>
      <div className="flex-1 rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">Nouvelle inscription</p>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary-soft text-primary">Actif</span>
        </div>
        <div className="h-9 rounded-md border border-primary ring-1 ring-primary bg-background px-3 flex items-center text-sm text-muted-foreground">
          Champ sélectionné
        </div>
        <span className="inline-flex h-9 px-4 items-center rounded-md bg-primary text-primary-foreground text-sm font-medium">
          Valider
        </span>
      </div>
    </div>
  );
}
