-- Warriors Management - Couleur de l'application choisie par l'administrateur
-- Idempotent : peut être ré-exécuté sans erreur. À exécuter avec warriors_admin
-- sur l'endpoint direct AVANT de déployer le code qui lit cette colonne.
--
-- Ajout uniquement : les organisations existantes gardent la couleur actuelle ("noir").

BEGIN;

ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "themeColor" TEXT NOT NULL DEFAULT 'noir';

COMMIT;
