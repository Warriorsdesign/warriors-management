import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

if (!process.env.DIRECT_URL) {
  throw new Error('DIRECT_URL est requis pour initialiser les forfaits.');
}

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
});

const plans = [
  { name: 'STARTER', description: 'Idéal pour commencer', price: 0, maxCenters: 1, maxStudents: 50, isPopular: false },
  { name: 'PRO', description: 'Pour les structures en croissance', price: 29.99, maxCenters: 3, maxStudents: 200, isPopular: true },
  { name: 'ENTERPRISE', description: 'Pour les grands réseaux', price: 99.99, maxCenters: 10, maxStudents: 1000, isPopular: false },
];

try {
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
  }
  console.log('Forfaits par défaut initialisés.');
} finally {
  await prisma.$disconnect();
}
