"use client";

import React, { useEffect, useState } from "react";
import { Check, Loader2, Palette } from "lucide-react";
import { useSession } from "@/lib/hooks/useSession";
import { updateOrganization } from "@/lib/hooks/useOrganization";
import { ApiClientError } from "@/lib/api/client";
import { useUIStore } from "@/lib/store/useUIStore";
import { applyTheme, DEFAULT_THEME, type ThemeKey } from "@/lib/config/themes";
import { ThemePicker, ThemePreview } from "@/components/settings/ThemePicker";
import { StepHeader } from "../shared";

/** Couleur de l'espace, enregistrée dès le clic (modifiable ensuite dans Paramètres > Apparence). */
export function AppearanceStep() {
  const { organization } = useSession();
  const showToast = useUIStore((s) => s.showToast);
  const saved = (organization?.themeColor ?? DEFAULT_THEME) as ThemeKey;
  const [value, setValue] = useState<ThemeKey>(saved);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => setValue(saved), [saved]);

  const choose = async (key: ThemeKey) => {
    const previous = value;
    setValue(key);
    applyTheme(key);
    setStatus("saving");
    try {
      await updateOrganization({ themeColor: key });
      setStatus("saved");
    } catch (err) {
      setValue(previous);
      applyTheme(previous);
      setStatus("idle");
      showToast(err instanceof ApiClientError ? err.message : "La couleur n’a pas pu être enregistrée.", "error");
    }
  };

  return (
    <div className="space-y-6">
      <StepHeader
        icon={Palette}
        title="La couleur de votre espace"
        description="Choisissez la couleur de l’application : toute votre équipe la verra. Vous pourrez la changer plus tard dans Paramètres, Apparence."
      />

      <div className="rounded-xl border border-border bg-card p-5 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-foreground">Couleur principale</p>
            <span className="text-xs text-muted-foreground flex items-center gap-1.5" aria-live="polite">
              {status === "saving" && <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enregistrement…</>}
              {status === "saved" && <><Check className="w-3.5 h-3.5 text-emerald-600" /> Couleur enregistrée</>}
            </span>
          </div>
          <ThemePicker value={value} onChange={choose} disabled={status === "saving"} />
        </div>
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Aperçu</p>
          <ThemePreview />
        </div>
      </div>
    </div>
  );
}
