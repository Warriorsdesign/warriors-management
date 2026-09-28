import { PrismaClient } from '@prisma/client';
import { ROLES } from '../src/lib/auth/roles';
import { SYSTEM_ROLE_KEYS, grantsToRows } from '../src/lib/auth/permissionCatalog';
import { systemTemplateGrants } from '../src/lib/auth/permissions';

/**
 * Crée / aligne les modèles globaux des rôles système. ADMIN n'a pas de permissions en base
 * (tous les droits par construction). La copie par organisation et la reprise des données
 * existantes sont faites par prisma/migrations-sql/2026-09-role-permissions.sql.
 */
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } }
});

async function main() {
  console.log('Migrating system role templates to DB...');

  const admin = await prisma.role.findFirst({ where: { name: ROLES.ADMIN, organizationId: null } });
  if (!admin) {
    await prisma.role.create({ data: { name: ROLES.ADMIN, isSystem: true, description: 'Role systeme ADMIN' } });
  }

  for (const key of SYSTEM_ROLE_KEYS) {
    console.log(`Processing role: ${key}`);
    const existing = await prisma.role.findFirst({ where: { name: key, organizationId: null } });
    const role = existing ?? await prisma.role.create({ data: { name: key, isSystem: true, systemKey: key } });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: grantsToRows(systemTemplateGrants(key)).map((row) => ({ ...row, roleId: role.id })),
    });
    await prisma.role.update({ where: { id: role.id }, data: { isSystem: true, systemKey: key } });
  }
  console.log('Done migrating roles.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
