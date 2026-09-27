import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL
    }
  }
});

async function main() {
  const plans = [
    { name: "STARTER", description: "Idéal pour commencer", price: 0, maxCenters: 1, maxStudents: 50, isPopular: false },
    { name: "PRO", description: "Pour les structures en croissance", price: 29.99, maxCenters: 3, maxStudents: 200, isPopular: true },
    { name: "ENTERPRISE", description: "Pour les grands réseaux", price: 99.99, maxCenters: 10, maxStudents: 1000, isPopular: false }
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
  }
  console.log("Plans par défaut créés avec succès !");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
