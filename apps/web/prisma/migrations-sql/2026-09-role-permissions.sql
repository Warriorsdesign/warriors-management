-- Warriors Management - Permissions fines et rôles système modifiables par organisation
-- Idempotent (réexécutable sans effet de bord).
--
-- 1. Rôles personnalisés existants : comportement conservé. Ceux qui lisaient les paiements
--    reçoivent le détail financier des étudiants, les indicateurs financiers et les rapports ;
--    ceux qui pouvaient encaisser reçoivent l'encaissement depuis la fiche. Exécuté une seule
--    fois (au premier passage, avant l'ajout de Role.systemKey) pour ne jamais réaccorder un
--    droit qu'un administrateur aurait retiré ensuite.
-- 2. Role.systemKey : marque la copie d'un rôle système propre à une organisation.
-- 3. Modèles globaux GESTIONNAIRE / COMPTABLE alignés sur les nouveaux réglages d'origine
--    (lib/auth/permissionCatalog.ts, SYSTEM_ROLE_TEMPLATES) : le GESTIONNAIRE n'a plus accès
--    aux Paiements, Dépenses, Rapports ni aux indicateurs financiers ; il voit seulement le
--    statut de paiement des étudiants.
-- 4. Chaque organisation reçoit sa copie modifiable de GESTIONNAIRE et COMPTABLE (une seule
--    fois : une copie existante, éventuellement adaptée par l'organisation, n'est pas touchée).
-- ADMIN n'est pas concerné : il a tous les droits par construction (lib/auth/permissions.ts).

BEGIN;

-- 1. Rôles personnalisés (premier passage uniquement).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'Role' AND column_name = 'systemKey'
  ) THEN
    INSERT INTO "RolePermission" ("id", "roleId", "resource", "canRead", "canWrite", "createdAt", "updatedAt")
    SELECT gen_random_uuid()::text, rp."roleId", x.resource, x.can_read, x.can_write, NOW(), NOW()
    FROM "RolePermission" rp
    JOIN "Role" r ON r."id" = rp."roleId" AND r."organizationId" IS NOT NULL AND r."isSystem" = false
    CROSS JOIN (VALUES
      ('students.finance_status', true, false),
      ('students.finance_detail', true, false),
      ('dashboard.finance',       true, false),
      ('reports',                 true, false)
    ) AS x(resource, can_read, can_write)
    WHERE rp."resource" = 'payments' AND rp."canRead" = true
    ON CONFLICT ("roleId", "resource") DO NOTHING;

    INSERT INTO "RolePermission" ("id", "roleId", "resource", "canRead", "canWrite", "createdAt", "updatedAt")
    SELECT gen_random_uuid()::text, rp."roleId", 'students.collect', false, true, NOW(), NOW()
    FROM "RolePermission" rp
    JOIN "Role" r ON r."id" = rp."roleId" AND r."organizationId" IS NOT NULL AND r."isSystem" = false
    WHERE rp."resource" = 'payments' AND rp."canWrite" = true
    ON CONFLICT ("roleId", "resource") DO NOTHING;
  END IF;
END $$;

-- 2. Colonne systemKey.
ALTER TABLE "Role" ADD COLUMN IF NOT EXISTS "systemKey" TEXT;

-- Réglages d'origine (ressource, lecture, écriture) des rôles système.
CREATE TEMP TABLE _role_template (role_name TEXT, resource TEXT, can_read BOOLEAN, can_write BOOLEAN) ON COMMIT DROP;
INSERT INTO _role_template VALUES
  ('GESTIONNAIRE', 'dashboard',               true,  false),
  ('GESTIONNAIRE', 'students',                true,  true),
  ('GESTIONNAIRE', 'students.finance_status', true,  false),
  ('GESTIONNAIRE', 'formations',              true,  true),
  ('GESTIONNAIRE', 'classes',                 true,  true),
  ('GESTIONNAIRE', 'centers',                 true,  false),
  ('GESTIONNAIRE', 'users',                   true,  false),
  ('COMPTABLE',    'dashboard',               true,  false),
  ('COMPTABLE',    'dashboard.finance',       true,  false),
  ('COMPTABLE',    'students',                true,  false),
  ('COMPTABLE',    'students.finance_status', true,  false),
  ('COMPTABLE',    'students.finance_detail', true,  false),
  ('COMPTABLE',    'students.collect',        false, true),
  ('COMPTABLE',    'formations',              true,  false),
  ('COMPTABLE',    'classes',                 true,  false),
  ('COMPTABLE',    'centers',                 true,  false),
  ('COMPTABLE',    'payments',                true,  true),
  ('COMPTABLE',    'expenses',                true,  true),
  ('COMPTABLE',    'reports',                 true,  false);

-- 3. Modèles globaux : systemKey + permissions remplacées par les réglages d'origine.
UPDATE "Role" SET "systemKey" = "name", "updatedAt" = NOW()
WHERE "organizationId" IS NULL AND "isSystem" = true AND "name" IN ('GESTIONNAIRE', 'COMPTABLE')
  AND "systemKey" IS DISTINCT FROM "name";

DELETE FROM "RolePermission" rp
USING "Role" r
WHERE rp."roleId" = r."id" AND r."organizationId" IS NULL AND r."name" IN ('GESTIONNAIRE', 'COMPTABLE')
  AND NOT EXISTS (
    SELECT 1 FROM _role_template t
    WHERE t.role_name = r."name" AND t.resource = rp."resource" AND t.can_read = rp."canRead" AND t.can_write = rp."canWrite"
  );

INSERT INTO "RolePermission" ("id", "roleId", "resource", "canRead", "canWrite", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, r."id", t.resource, t.can_read, t.can_write, NOW(), NOW()
FROM "Role" r
JOIN _role_template t ON t.role_name = r."name"
WHERE r."organizationId" IS NULL AND r."isSystem" = true
ON CONFLICT ("roleId", "resource") DO NOTHING;

-- 4. Copie par organisation (permissions insérées uniquement pour les copies créées ici).
WITH new_roles AS (
  INSERT INTO "Role" ("id", "name", "description", "isSystem", "systemKey", "organizationId", "createdAt", "updatedAt")
  SELECT gen_random_uuid()::text, k.name,
         CASE k.name
           WHEN 'GESTIONNAIRE' THEN 'Gestion pédagogique : inscriptions, classes et formations, sans accès à la trésorerie.'
           ELSE 'Encaissements, dépenses et rapports financiers.'
         END,
         true, k.name, o."id", NOW(), NOW()
  FROM "Organization" o
  CROSS JOIN (VALUES ('GESTIONNAIRE'), ('COMPTABLE')) AS k(name)
  WHERE NOT EXISTS (SELECT 1 FROM "Role" r WHERE r."organizationId" = o."id" AND r."name" = k.name)
  RETURNING "id", "systemKey"
)
INSERT INTO "RolePermission" ("id", "roleId", "resource", "canRead", "canWrite", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, n."id", t.resource, t.can_read, t.can_write, NOW(), NOW()
FROM new_roles n
JOIN _role_template t ON t.role_name = n."systemKey";

COMMIT;
