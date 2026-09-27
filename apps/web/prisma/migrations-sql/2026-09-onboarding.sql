-- Warriors Management - Onboarding du premier administrateur
-- Idempotent : peut être ré-exécuté sans erreur. À exécuter avec le rôle de migration
-- (DIRECT_URL) AVANT de déployer le code qui lit ces colonnes.
--
-- Ajouts uniquement : aucune colonne supprimée, aucune donnée existante altérée
-- en dehors de la reprise ponctuelle de "onboardingStatus" ci-dessous.

BEGIN;

ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "onboardingStatus" TEXT NOT NULL DEFAULT 'non_commence';
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "onboardingStep" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "onboardingSkippedSteps" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMP(3);
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "onboardingCompletedById" TEXT;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);

-- Reprise des organisations existantes (règle ponctuelle de migration, pas le mécanisme de
-- détection) : une organisation qui possède déjà au moins un centre ou un étudiant est
-- considérée comme configurée, pour ne pas imposer l'assistant à ses administrateurs actuels.
-- Ne touche que les lignes jamais passées par l'assistant (statut par défaut, aucune étape
-- enregistrée). À exécuter UNE fois par environnement, au moment du déploiement : une
-- ré-exécution tardive marquerait aussi comme configurées les organisations créées depuis
-- qui auraient saisi des données sans jamais ouvrir l'assistant.
UPDATE "Organization" o
SET "onboardingStatus" = 'termine',
    "onboardingCompletedAt" = NOW()
WHERE o."onboardingStatus" = 'non_commence'
  AND o."onboardingCompletedAt" IS NULL
  AND o."onboardingStep" IS NULL
  AND (
    EXISTS (SELECT 1 FROM "Center" c WHERE c."organizationId" = o."id")
    OR EXISTS (SELECT 1 FROM "Student" s WHERE s."organizationId" = o."id")
  );

COMMIT;
