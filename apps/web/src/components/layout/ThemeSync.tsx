"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/hooks/useSession";
import { applyTheme, resetTheme } from "@/lib/config/themes";

/** Applique la couleur choisie par l'organisation dès que la session est connue. */
export function ThemeSync() {
  const { organization } = useSession();
  const themeColor = organization?.themeColor;

  useEffect(() => {
    if (themeColor) applyTheme(themeColor);
  }, [themeColor]);

  return null;
}

/** Back-office plateforme : toujours la couleur par défaut, quelle que soit l'organisation. */
export function ThemeReset() {
  useEffect(() => {
    resetTheme();
  }, []);
  return null;
}
