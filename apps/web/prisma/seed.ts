/**
 * Script de seed pour la vérification manuelle des routes API (Phase 4).
 * Crée deux organisations de test avec un ADMIN chacune, pour permettre les tests
 * d'isolation cross-tenant (RLS) décrits dans le plan.
 *
 * Nettoyage via DIRECT_URL (rôle postgres, bypass RLS) car il faut retrouver les
 * anciens orgs de test sans connaître leur id à l'avance - usage légitime d'un
 * script de dev, distinct du runtime applicatif qui n'utilise jamais ce rôle.
 * Création via basePrisma (rôle app_user, DATABASE_URL) en amorçant app.org_id à
 * l'id du nouvel org avant de l'insérer, pour satisfaire sa propre policy RLS
 * WITH CHECK (id = app.org_id) sans jamais passer par le rôle privilégié.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { basePrisma } from '../src/lib/db';
import { generateUserMatricule } from '../src/lib/business/matricule';

const TEST_ADMIN_EMAILS = ['admin@org-a.test', 'admin@org-b.test'];
export const TEST_PASSWORD = 'Password123!';

async function cleanup() {
  const direct = new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL } } });
  const users = await direct.user.findMany({ where: { email: { in: TEST_ADMIN_EMAILS } } });
  const orgIds = Array.from(new Set(users.map((u) => u.organizationId).filter((id): id is string => Boolean(id))));
  if (orgIds.length > 0) {
    await direct.organization.deleteMany({ where: { id: { in: orgIds } } });
  }
  await direct.$disconnect();
}

async function seedOrg(name: string, adminEmail: string) {
  const orgId = randomUUID();
  return basePrisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SELECT set_config('app.org_id', $1, true)`, orgId);
    const org = await tx.organization.create({ data: { id: orgId, name, email: adminEmail } });
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
    const matricule = await generateUserMatricule(org.name);
    const admin = await tx.user.create({
      data: {
        firstName: 'Admin',
        lastName: name,
        email: adminEmail,
        matricule,
        passwordHash,
        roles: ['ADMIN'],
        status: 'actif',
        organizationId: org.id,
      },
    });
    return { org, admin };
  });
}

async function main() {
  await cleanup();
  const a = await seedOrg('Org A Test', 'admin@org-a.test');
  const b = await seedOrg('Org B Test', 'admin@org-b.test');
  console.log('Seeded:', { orgA: a.org.id, orgB: b.org.id });
}

main()
  .then(() => basePrisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await basePrisma.$disconnect();
    process.exit(1);
  });
