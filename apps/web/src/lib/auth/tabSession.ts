/**
 * Déconnexion à la fermeture de l'application (onglet ou navigateur).
 *
 * - Fermeture du navigateur : le cookie de connexion est un cookie de session (sans durée),
 *   effacé par le navigateur.
 * - Fermeture de l'onglet : chaque onglet connecté porte une marque en sessionStorage, qui
 *   disparaît avec lui. Un onglet qui s'ouvre sans marque demande aux autres onglets de
 *   l'application (BroadcastChannel) s'ils sont encore ouverts : si oui, il rejoint la
 *   session ; sinon, la session appartenait à un onglet fermé et l'utilisateur est déconnecté.
 *   Un rechargement de page conserve la marque : il ne déconnecte pas.
 */

export type TabSessionScope = 'app' | 'admin';

const markerKey = (scope: TabSessionScope) => `wm-tab-session:${scope}`;
const channelName = (scope: TabSessionScope) => `wm-tab-session:${scope}`;

export function markTabSession(scope: TabSessionScope): void {
  try {
    sessionStorage.setItem(markerKey(scope), '1');
  } catch {
    // Stockage indisponible (navigation privée stricte) : l'onglet sera revérifié au prochain chargement.
  }
}

export function hasTabSession(scope: TabSessionScope): boolean {
  try {
    return sessionStorage.getItem(markerKey(scope)) === '1';
  } catch {
    return false;
  }
}

export function clearTabSession(scope: TabSessionScope): void {
  try {
    sessionStorage.removeItem(markerKey(scope));
  } catch {
    // ignoré
  }
}

/** Un autre onglet connecté de l'application répond-il ? */
export function otherTabAlive(scope: TabSessionScope, timeoutMs = 400): Promise<boolean> {
  if (typeof BroadcastChannel === 'undefined') return Promise.resolve(false);
  return new Promise((resolve) => {
    const channel = new BroadcastChannel(channelName(scope));
    const done = (alive: boolean) => {
      clearTimeout(timer);
      channel.close();
      resolve(alive);
    };
    const timer = setTimeout(() => done(false), timeoutMs);
    channel.onmessage = (event) => {
      if (event.data === 'pong') done(true);
    };
    channel.postMessage('ping');
  });
}

/** Répond aux onglets qui s'ouvrent ; renvoie la fonction d'arrêt. */
export function answerTabPings(scope: TabSessionScope): () => void {
  if (typeof BroadcastChannel === 'undefined') return () => {};
  const channel = new BroadcastChannel(channelName(scope));
  channel.onmessage = (event) => {
    if (event.data === 'ping') channel.postMessage('pong');
  };
  return () => channel.close();
}
