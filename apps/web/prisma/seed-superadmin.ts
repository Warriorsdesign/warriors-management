import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

export const INITIAL_SUPERADMIN = {
  email: 'superadmin@warriors.com',
  password: 'SuperAdmin2026!',
  firstName: 'Super',
  lastName: 'Admin',
  matricule: 'SA-ROOT',
};

async function seedSuperAdmin() {
  console.log('Seeding initial Super Admin...');
  const existing = await prisma.user.findFirst({
    where: {
      email: INITIAL_SUPERADMIN.email,
    },
  });

  const passwordHash = await bcrypt.hash(INITIAL_SUPERADMIN.password, 10);

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        isSuperAdmin: true,
        roles: ['SUPER_ADMIN'],
        status: 'actif',
        passwordHash,
      },
    });
    console.log('Existing Super Admin updated:', INITIAL_SUPERADMIN.email);
  } else {
    const created = await prisma.user.create({
      data: {
        firstName: INITIAL_SUPERADMIN.firstName,
        lastName: INITIAL_SUPERADMIN.lastName,
        email: INITIAL_SUPERADMIN.email,
        matricule: INITIAL_SUPERADMIN.matricule,
        passwordHash,
        isSuperAdmin: true,
        roles: ['SUPER_ADMIN'],
        organizationId: null,
        status: 'actif',
      },
    });
    console.log('Super Admin created:', created.email);
  }

  // Also check if existing organizations have a subscription, if not create default trial subscription
  const orgsWithoutSub = await prisma.organization.findMany({
    where: { subscription: null },
  });

  for (const org of orgsWithoutSub) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    await prisma.subscription.create({
      data: {
        organizationId: org.id,
        status: 'trial',
        startDate: new Date(),
        endDate,
        maxCenters: 3,
        maxStudents: 200,
      },
    });
    console.log(`Created default subscription for org: ${org.name}`);
  }
}

seedSuperAdmin()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
