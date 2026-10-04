/**
 * Couleurs d'application au choix de l'administrateur (réglage par organisation).
 * Source unique : la pastille du réglage, le script anti-flash du layout racine et applyTheme()
 * lisent tous ce tableau. Seule la couleur principale change ; les couleurs qui ont un sens
 * (retard, erreur, à jour) restent fixes. Chaque teinte garde un contraste >= 4.5:1 avec le blanc.
 */
export const THEMES = [
  { key: "noir", label: "Noir", primary: "#171717", soft: "#EDEDED" },
  { key: "bleu", label: "Bleu", primary: "#1D4ED8", soft: "#E8EEFC" },
  { key: "rouge", label: "Rouge", primary: "#B91C1C", soft: "#FBEAEA" },
  { key: "orange", label: "Orange", primary: "#C2410C", soft: "#FDEEE6" },
  { key: "vert", label: "Vert", primary: "#15803D", soft: "#E7F4EC" },
  { key: "prune", label: "Prune", primary: "#5D0E41", soft: "#F4E9EF" },
] as const;

export type ThemeKey = (typeof THEMES)[number]["key"];
export const THEME_KEYS = THEMES.map((t) => t.key) as [ThemeKey, ...ThemeKey[]];
export const DEFAULT_THEME: ThemeKey = "noir";
export const THEME_STORAGE_KEY = "wm-theme";

function findTheme(key: string | null | undefined) {
  return THEMES.find((t) => t.key === key) ?? THEMES[0];
}

/** Applique la couleur sur <html> et la mémorise pour le prochain chargement (anti-flash). */
export function applyTheme(key: string | null | undefined) {
  const theme = findTheme(key);
  const style = document.documentElement.style;
  style.setProperty("--primary", theme.primary);
  style.setProperty("--ring", theme.primary);
  style.setProperty("--primary-soft", theme.soft);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme.key);
  } catch {
    // Stockage indisponible (navigation privée) : la couleur reste appliquée pour la session.
  }
}

/** Retire la couleur (back-office plateforme : il garde la couleur par défaut). */
export function resetTheme() {
  const style = document.documentElement.style;
  ["--primary", "--ring", "--primary-soft"].forEach((v) => style.removeProperty(v));
}

/** Script inline exécuté avant le premier affichage : remet la dernière couleur connue. */
export const THEME_BOOTSTRAP = `(function(){try{if(location.pathname.indexOf('/admin')===0)return;var t=${JSON.stringify(
  Object.fromEntries(THEMES.map((t) => [t.key, [t.primary, t.soft]]))
)}[localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})];if(!t)return;var s=document.documentElement.style;s.setProperty('--primary',t[0]);s.setProperty('--ring',t[0]);s.setProperty('--primary-soft',t[1]);}catch(e){}})();`;
