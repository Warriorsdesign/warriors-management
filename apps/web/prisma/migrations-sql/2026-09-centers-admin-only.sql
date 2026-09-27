-- Warriors Management - Création / modification / suppression des centres réservées aux administrateurs
-- Idempotent. Aligne les permissions des rôles système sur lib/auth/roles.ts (PERMISSIONS.centers.write = [ADMIN]).
-- Les routes API l'imposent déjà côté serveur (allowedRoles: ADMIN) ; cette mise à jour évite
-- que l'écran "Rôles & Permissions" affiche un droit d'écriture qui n'est plus effectif.
-- Aucune ligne supprimée : seul canWrite passe à false (la lecture des centres est conservée).

UPDATE "RolePermission" rp
SET "canWrite" = false, "updatedAt" = NOW()
FROM "Role" r
WHERE rp."roleId" = r."id"
  AND r."isSystem" = true
  AND r."name" <> 'ADMIN'
  AND rp."resource" = 'centers'
  AND rp."canWrite" = true;
