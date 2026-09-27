import { PrismaClient } from '@prisma/client';
import { ROLES, PERMISSIONS } from '../src/lib/auth/roles';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } }
});

async function main() {
  console.log('Migrating roles to DB...');

  for (const roleName of Object.values(ROLES)) {
    console.log(`Processing role: ${roleName}`);
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: { isSystem: true },
      create: { name: roleName, isSystem: true, description: `Role systeme ${roleName}` }
    });

    for (const [resource, perms] of Object.entries(PERMISSIONS)) {
      const canRead = (perms as any).read?.includes(roleName) ?? false;
      const canWrite = (perms as any).write?.includes(roleName) ?? false;

      if (canRead || canWrite) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_resource: { roleId: role.id, resource }
          },
          update: { canRead, canWrite },
          create: {
            roleId: role.id,
            resource,
            canRead,
            canWrite
          }
        });
      }
    }
  }
  console.log('Done migrating roles.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
