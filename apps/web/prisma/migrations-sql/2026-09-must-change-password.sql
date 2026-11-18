-- Warriors Management - Changement de mot de passe obligatoire
-- Idempotent. À exécuter avec le rôle de migration (DIRECT_URL) AVANT de déployer le code.
--
-- Ajout d'une colonne uniquement. Les comptes existants reçoivent false : ils utilisent déjà
-- l'application et ne sont pas forcés de changer leur mot de passe. Seuls les comptes créés
-- ou réinitialisés après ce déploiement le seront.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
