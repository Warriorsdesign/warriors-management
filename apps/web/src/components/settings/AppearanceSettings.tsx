"use client";

import { useEffect, useRef, useState } from "react";
import { Check, LayoutDashboard, Loader2, Save, Users } from "lucide-react";
import { useSession } from "@/lib/hooks/useSession";
import { updateOrganization } from "@/lib/hooks/useOrganization";
import { ApiClientError } from "@/lib/api/client";
import { useUIStore } from "@/lib/store/useUIStore";
import { applyTheme, DEFAULT_THEME, THEMES, type ThemeKey } from "@/lib/config/themes";
import { cn } from "@/lib/utils";

/**
 * Couleur de l'application pour toute l'organisation (administrateur seulement).
 * Cliquer une pastille prévisualise la couleur sur toute l'application ; sans enregistrement,
 * la couleur enregistrée revient en quittant l'onglet.
 */
export function AppearanceSettings() {
  const { organization } = useSession();
  const showToast = useUIStore((s) => s.showToast);
  const saved = (organization?.themeColor ?? DEFAULT_THEME) as ThemeKey;
  const [selected, setSelected] = useState<ThemeKey>(saved);
  const [isSaving, setIsSaving] = useState(false);
  const savedRef = useRef(saved);

  useEffect(() => {
    savedRef.current = saved;
    setSelected(saved);
  }, [saved]);

  // En quittant l'onglet sans enregistrer : retour à la couleur enregistrée.
  useEffect(() => () => applyTheme(savedRef.current), []);

  const choose = (key: ThemeKey) => {
    setSelected(key);
    applyTheme(key);
  };

  const cancel = () => choose(saved);

  const save = async () => {
    setIsSaving(true);
    try {
      await updateOrganization({ themeColor: selected });
      savedRef.current = selected;
      showToast("Couleur de l'application enregistrée pour toute l'équipe.");
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : "Une erreur est survenue.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const dirty = selected !== saved;

  return (
    <div className="max-w-2xl space-y-8 animate-in fade-in duration-300">
      <div className="border-b border-border pb-4">
        <h2 className="text-xl font-semibold text-foreground">Apparence</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choisissez la couleur de l&apos;application. Elle s&apos;applique à toute votre équipe.
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-foreground mb-3">Couleur principale</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3" role="radiogroup" aria-label="Couleur principale">
          {THEMES.map((t) => {
            const active = selected === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => choose(t.key)}
                className={cn(
                  "group flex flex-col items-center gap-2 rounded-xl border p-3 transition-all",
                  active ? "border-foreground/30 bg-secondary/40" : "border-border hover:border-foreground/20"
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
        <p className="text-xs text-muted-foreground mt-3">
          Les couleurs d&apos;état (retard, erreur, à jour) ne changent pas, pour rester lisibles quelle que soit la couleur choisie.
        </p>
      </div>

      {/* Aperçu : suit la couleur sélectionnée (variables appliquées sur toute l'application) */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Aperçu</p>
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
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
        {dirty && (
          <button type="button" onClick={cancel} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Annuler
          </button>
        )}
        <button
          type="button"
          onClick={save}
          disabled={!dirty || isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Enregistrer
        </button>
      </div>
    </div>
  );
}
