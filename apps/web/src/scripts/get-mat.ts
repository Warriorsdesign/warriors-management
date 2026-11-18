import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const u = await prisma.user.findFirst({ where: { email: 'admin@org-a.test' } });
  console.log('MATRICULE:', u?.matricule);
}
main().finally(() => prisma.$disconnect());
