-- Warriors Management - RLS & rôles applicatifs (voir /backend.md)
-- Idempotent: peut être ré-exécuté sans erreur.

-- 1. Rôles PostgreSQL applicatifs (LOGIN, sans BYPASSRLS, sans privilège DDL)
--    Le rôle `postgres` (utilisé pour les migrations Prisma via DIRECT_URL) a BYPASSRLS
--    et ne doit donc JAMAIS être utilisé par l'application au runtime (cf. backend.md §3).
DO $$
BEGIN
  -- Note: ALTER ROLE ... (NO)SUPERUSER requires the invoker to itself be a superuser
  -- in PostgreSQL, even to explicitly set NOSUPERUSER. `postgres` here is not a true
  -- superuser (Supabase-managed), so SUPERUSER is only set at CREATE time (default:
  -- NOSUPERUSER) and left untouched on subsequent ALTERs.
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user LOGIN PASSWORD '__APP_USER_PW__' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS NOREPLICATION;
  ELSE
    ALTER ROLE app_user WITH LOGIN PASSWORD '__APP_USER_PW__' NOCREATEDB NOCREATEROLE NOBYPASSRLS NOREPLICATION;
  END IF;

  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_auth') THEN
    CREATE ROLE app_auth LOGIN PASSWORD '__APP_AUTH_PW__' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS NOREPLICATION;
  ELSE
    ALTER ROLE app_auth WITH LOGIN PASSWORD '__APP_AUTH_PW__' NOCREATEDB NOCREATEROLE NOBYPASSRLS NOREPLICATION;
  END IF;
END
$$;

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
--    Colonnes organizationId/id sont de type text (uuid() généré côté Prisma) -> pas de cast ::uuid.

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

-- 3bis. Table de jonction implicite Prisma pour Center.users <-> User.centers ("A"=Center.id, "B"=User.id).
--       Pas de colonne organizationId propre : on résout via la table Center liée.
ALTER TABLE "_CenterUsers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_CenterUsers" FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_centerusers ON "_CenterUsers";
CREATE POLICY tenant_isolation_centerusers ON "_CenterUsers"
  FOR ALL TO app_user
  USING (EXISTS (SELECT 1 FROM "Center" WHERE "Center"."id" = "_CenterUsers"."A" AND "Center"."organizationId" = current_setting('app.org_id', true)))
  WITH CHECK (EXISTS (SELECT 1 FROM "Center" WHERE "Center"."id" = "_CenterUsers"."A" AND "Center"."organizationId" = current_setting('app.org_id', true)));

-- 4. Politique dédiée à `app_auth` (lookup par email au login, avant que l'org soit connue).
--    Lecture seule, restreinte à la table User.
DROP POLICY IF EXISTS auth_read_user ON "User";
CREATE POLICY auth_read_user ON "User"
  FOR SELECT TO app_auth
  USING (true);

-- 5. Attribution des permissions.
GRANT USAGE ON SCHEMA public TO app_user, app_auth;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT SELECT ON "User" TO app_auth;

-- IMPORTANT: `postgres` (BYPASSRLS) reste réservé aux migrations Prisma (DIRECT_URL, port 5432).
-- Le runtime applicatif (Prisma Client / basePrisma) doit utiliser DATABASE_URL = app_user
-- et authPrisma doit utiliser AUTH_DATABASE_URL = app_auth (voir backend.md §5-6).
