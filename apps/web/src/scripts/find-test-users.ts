import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log("--- VÉRIFICATION MOTS DE PASSE ---");
  
  const clientUser = await prisma.user.findFirst({
    where: { email: "admin@org-a.test" }
  });
  
  if (clientUser) {
    const match = await bcrypt.compare("Password123!", clientUser.passwordHash);
    console.log(`Client admin@org-a.test password match Password123!: ${match}`);
    console.log(`MATRICULE: ${clientUser.matricule}`);
  }

  const adminUser = await prisma.user.findFirst({
    where: { email: "superadmin@warriors.com" }
  });

  if (adminUser) {
    const match = await bcrypt.compare("Password123!", adminUser.passwordHash);
    console.log(`SuperAdmin superadmin@warriors.com password match Password123!: ${match}`);
    const match2 = await bcrypt.compare("admin123", adminUser.passwordHash);
    console.log(`SuperAdmin password match admin123: ${match2}`);
    const match3 = await bcrypt.compare("superadmin", adminUser.passwordHash);
    console.log(`SuperAdmin password match superadmin: ${match3}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
