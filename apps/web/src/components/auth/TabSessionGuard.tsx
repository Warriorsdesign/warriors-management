"use client";

import { useEffect, useState } from "react";
import { mutate as globalMutate } from "swr";
import { answerTabPings, hasTabSession, markTabSession, otherTabAlive, type TabSessionScope } from "@/lib/auth/tabSession";

/**
 * N'affiche l'application qu'à un onglet appartenant à une session ouverte (voir
 * lib/auth/tabSession.ts). Sinon, déconnexion puis retour à la page de connexion, avant
 * qu'aucune donnée ne soit affichée.
 */
export function TabSessionGuard({
  scope,
  logoutUrl,
  loginPath,
  children,
}: {
  scope: TabSessionScope;
  logoutUrl: string;
  loginPath: string;
  children: React.ReactNode;
}) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (hasTabSession(scope) || (await otherTabAlive(scope))) {
        markTabSession(scope);
        if (!cancelled) setAllowed(true);
        return;
      }
      try {
        await fetch(logoutUrl, { method: "POST", credentials: "same-origin" });
      } finally {
        await globalMutate(() => true, undefined, { revalidate: false });
        window.location.replace(loginPath);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scope, logoutUrl, loginPath]);

  // Tant que l'onglet est ouvert, il signale sa présence aux nouveaux onglets.
  useEffect(() => (allowed ? answerTabPings(scope) : undefined), [allowed, scope]);

  if (!allowed) return <div className="min-h-screen bg-background" />;
  return <>{children}</>;
}
