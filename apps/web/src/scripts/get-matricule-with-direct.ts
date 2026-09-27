import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Assurez-vous que les variables d'environnement sont chargées
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('Connexion à la base de données...');
  const user = await prisma.user.findFirst({
    where: { email: 'admin@org-a.test' },
  });

  if (user) {
    console.log(`MATRICULE_FOUND: ${user.matricule}`);
    console.log(`USER_ID: ${user.id}`);
  } else {
    console.log("Utilisateur non trouvé");
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
