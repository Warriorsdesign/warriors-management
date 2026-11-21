-- Warriors Management - PostgreSQL RLS & rôle applicatif (voir /backend.md)
-- Idempotent: peut être ré-exécuté sans erreur.

-- 1. Rôle PostgreSQL applicatif (NOLOGIN, sans BYPASSRLS ni privilège DDL).
--    L'application s'y réduit avec SET LOCAL ROLE dans chaque transaction tenant.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS NOREPLICATION;
  ELSE
    ALTER ROLE app_user WITH NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS NOREPLICATION;
  END IF;
END
$$;

GRANT app_user TO warriors_admin;

-- 2. Activation + FORCE de Row Level Security sur toutes les tables métiers,
--    y compris Organization (racine du tenant elle-même).
ALTER TABLE "Organization"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Organization"     FORCE  ROW LEVEL SECURITY;
ALTER TABLE "Center"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Center"           FORCE  ROW LEVEL SECURITY;
ALTER TABLE "User"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User"             FORCE  ROW LEVEL SECURITY;
ALTER TABLE "Formation"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Formation"        FORCE  ROW LEVEL SECURITY;
ALTER TABLE "ClassGroup"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClassGroup"       FORCE  ROW LEVEL SECURITY;
ALTER TABLE "Student"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Student"          FORCE  ROW LEVEL SECURITY;
ALTER TABLE "PaymentSchedule"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentSchedule"  FORCE  ROW LEVEL SECURITY;
ALTER TABLE "Payment"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment"          FORCE  ROW LEVEL SECURITY;
ALTER TABLE "Expense"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Expense"          FORCE  ROW LEVEL SECURITY;
ALTER TABLE "Subscription"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription"     FORCE  ROW LEVEL SECURITY;
ALTER TABLE "AuditLog"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog"         FORCE  ROW LEVEL SECURITY;

-- 3. Politiques d'isolation tenant pour `app_user`.
--    app.org_id est injecté par withTenantContext() via set_config() à chaque transaction.
--    Les identifiants sont du texte contenant des UUID; aucun cast ::uuid n'est nécessaire.

DROP POLICY IF EXISTS tenant_isolation_organization ON "Organization";
CREATE POLICY tenant_isolation_organization ON "Organization"
  FOR ALL TO app_user
  USING ("id" = current_setting('app.org_id', true))
  WITH CHECK ("id" = current_setting('app.org_id', true));

DROP POLICY IF EXISTS tenant_isolation_center ON "Center";
CREATE POLICY tenant_isolation_center ON "Center"
  FOR ALL TO app_user
  USING ("organizationId" = current_setting('app.org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.org_id', true));

DROP POLICY IF EXISTS tenant_isolation_user ON "User";
CREATE POLICY tenant_isolation_user ON "User"
  FOR ALL TO app_user
  USING ("organizationId" = current_setting('app.org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.org_id', true));

DROP POLICY IF EXISTS tenant_isolation_formation ON "Formation";
CREATE POLICY tenant_isolation_formation ON "Formation"
  FOR ALL TO app_user
  USING ("organizationId" = current_setting('app.org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.org_id', true));

DROP POLICY IF EXISTS tenant_isolation_classgroup ON "ClassGroup";
CREATE POLICY tenant_isolation_classgroup ON "ClassGroup"
  FOR ALL TO app_user
  USING ("organizationId" = current_setting('app.org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.org_id', true));

DROP POLICY IF EXISTS tenant_isolation_student ON "Student";
CREATE POLICY tenant_isolation_student ON "Student"
  FOR ALL TO app_user
  USING ("organizationId" = current_setting('app.org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.org_id', true));

DROP POLICY IF EXISTS tenant_isolation_paymentschedule ON "PaymentSchedule";
CREATE POLICY tenant_isolation_paymentschedule ON "PaymentSchedule"
  FOR ALL TO app_user
  USING ("organizationId" = current_setting('app.org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.org_id', true));

DROP POLICY IF EXISTS tenant_isolation_payment ON "Payment";
CREATE POLICY tenant_isolation_payment ON "Payment"
  FOR ALL TO app_user
  USING ("organizationId" = current_setting('app.org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.org_id', true));

DROP POLICY IF EXISTS tenant_isolation_expense ON "Expense";
CREATE POLICY tenant_isolation_expense ON "Expense"
  FOR ALL TO app_user
  USING ("organizationId" = current_setting('app.org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.org_id', true));

DROP POLICY IF EXISTS tenant_isolation_subscription ON "Subscription";
CREATE POLICY tenant_isolation_subscription ON "Subscription"
  FOR ALL TO app_user
  USING ("organizationId" = current_setting('app.org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.org_id', true));

DROP POLICY IF EXISTS tenant_auditlog_insert ON "AuditLog";
CREATE POLICY tenant_auditlog_insert ON "AuditLog"
  FOR INSERT TO app_user
  WITH CHECK (true);

-- 3bis. Table de jonction Center.users <-> User.centers ("A"=Center.id, "B"=User.id).
--       Pas de colonne organizationId propre : on résout via la table Center liée.
ALTER TABLE "_CenterUsers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_CenterUsers" FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_centerusers ON "_CenterUsers";
CREATE POLICY tenant_isolation_centerusers ON "_CenterUsers"
  FOR ALL TO app_user
  USING (EXISTS (SELECT 1 FROM "Center" WHERE "Center"."id" = "_CenterUsers"."A" AND "Center"."organizationId" = current_setting('app.org_id', true)))
  WITH CHECK (EXISTS (SELECT 1 FROM "Center" WHERE "Center"."id" = "_CenterUsers"."A" AND "Center"."organizationId" = current_setting('app.org_id', true)));

-- 3ter. Table de jonction Formation.centers <-> Center.formations ("A"=Center.id, "B"=Formation.id).
ALTER TABLE "_FormationCenters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_FormationCenters" FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_formationcenters ON "_FormationCenters";
CREATE POLICY tenant_isolation_formationcenters ON "_FormationCenters"
  FOR ALL TO app_user
  USING (EXISTS (SELECT 1 FROM "Center" c WHERE c."id" = "_FormationCenters"."A" AND c."organizationId" = current_setting('app.org_id', true))
     AND EXISTS (SELECT 1 FROM "Formation" f WHERE f."id" = "_FormationCenters"."B" AND f."organizationId" = current_setting('app.org_id', true)))
  WITH CHECK (EXISTS (SELECT 1 FROM "Center" c WHERE c."id" = "_FormationCenters"."A" AND c."organizationId" = current_setting('app.org_id', true))
     AND EXISTS (SELECT 1 FROM "Formation" f WHERE f."id" = "_FormationCenters"."B" AND f."organizationId" = current_setting('app.org_id', true)));

-- 4. Attribution des permissions au rôle applicatif.
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;

-- DATABASE_URL utilise warriors_admin. Les requêtes tenant basculent en app_user
-- dans leur transaction; les opérations globales et migrations gardent le rôle admin.
