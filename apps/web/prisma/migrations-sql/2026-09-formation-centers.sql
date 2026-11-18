-- Warriors Management - Centres d'une formation (relation Formation <-> Center)
-- Idempotent. À exécuter avec le rôle de migration (DIRECT_URL) AVANT de déployer le code.
--
-- Table de jonction implicite Prisma "_FormationCenters" : "A" = Center.id, "B" = Formation.id.
-- Ajout uniquement : aucune table ni donnée existante n'est supprimée ou modifiée.

BEGIN;

CREATE TABLE IF NOT EXISTS "_FormationCenters" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "_FormationCenters_AB_unique" ON "_FormationCenters"("A", "B");
CREATE INDEX IF NOT EXISTS "_FormationCenters_B_index" ON "_FormationCenters"("B");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_FormationCenters_A_fkey') THEN
    ALTER TABLE "_FormationCenters" ADD CONSTRAINT "_FormationCenters_A_fkey"
      FOREIGN KEY ("A") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_FormationCenters_B_fkey') THEN
    ALTER TABLE "_FormationCenters" ADD CONSTRAINT "_FormationCenters_B_fkey"
      FOREIGN KEY ("B") REFERENCES "Formation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

-- Isolation tenant (même principe que "_CenterUsers") : la ligne est visible/modifiable si le
-- centre ET la formation appartiennent à l'organisation courante.
ALTER TABLE "_FormationCenters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_FormationCenters" FORCE  ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_formationcenters ON "_FormationCenters";
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
    CREATE POLICY tenant_isolation_formationcenters ON "_FormationCenters"
      FOR ALL TO app_user
      USING (
        EXISTS (SELECT 1 FROM "Center" c WHERE c."id" = "_FormationCenters"."A" AND c."organizationId" = current_setting('app.org_id', true))
        AND EXISTS (SELECT 1 FROM "Formation" f WHERE f."id" = "_FormationCenters"."B" AND f."organizationId" = current_setting('app.org_id', true))
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM "Center" c WHERE c."id" = "_FormationCenters"."A" AND c."organizationId" = current_setting('app.org_id', true))
        AND EXISTS (SELECT 1 FROM "Formation" f WHERE f."id" = "_FormationCenters"."B" AND f."organizationId" = current_setting('app.org_id', true))
      );
    GRANT SELECT, INSERT, UPDATE, DELETE ON "_FormationCenters" TO app_user;
  END IF;
END
$$;

-- Reprise des formations existantes (sans effet si déjà faite) :
-- 1. une formation qui a des classes est proposée dans les centres de ces classes ;
INSERT INTO "_FormationCenters" ("A", "B")
SELECT DISTINCT cg."centerId", cg."formationId"
FROM "ClassGroup" cg
ON CONFLICT DO NOTHING;

-- 2. une formation sans classe ni centre est proposée dans tous les centres de son organisation,
--    ce qui reproduit exactement sa visibilité actuelle (visible de tous les utilisateurs).
INSERT INTO "_FormationCenters" ("A", "B")
SELECT c."id", f."id"
FROM "Formation" f
JOIN "Center" c ON c."organizationId" = f."organizationId"
WHERE NOT EXISTS (SELECT 1 FROM "_FormationCenters" fc WHERE fc."B" = f."id")
ON CONFLICT DO NOTHING;

COMMIT;
