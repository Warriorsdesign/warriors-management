"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { ThemePicker, ThemePreview } from "./ThemePicker";
import { useSession } from "@/lib/hooks/useSession";
import { updateOrganization } from "@/lib/hooks/useOrganization";
import { ApiClientError } from "@/lib/api/client";
import { useUIStore } from "@/lib/store/useUIStore";
import { applyTheme, DEFAULT_THEME, type ThemeKey } from "@/lib/config/themes";

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
        <ThemePicker value={selected} onChange={choose} />
        <p className="text-xs text-muted-foreground mt-3">
          Les couleurs d&apos;état (retard, erreur, à jour) ne changent pas, pour rester lisibles quelle que soit la couleur choisie.
        </p>
      </div>

      {/* Aperçu : suit la couleur sélectionnée (variables appliquées sur toute l'application) */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Aperçu</p>
        <ThemePreview />
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
