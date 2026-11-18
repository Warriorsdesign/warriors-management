import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function main() {
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DIRECT_URL } }
  });

  try {
    console.log('Exécution de ALTER ROLE app_user...');
    // Extraction du mot de passe de app_user depuis DATABASE_URL
    const match = process.env.DATABASE_URL?.match(/:([^:@]+)@/);
    if (!match) throw new Error('Mot de passe introuvable dans DATABASE_URL');
    const pw = match[1];

    await prisma.$executeRawUnsafe(`ALTER ROLE app_user WITH LOGIN PASSWORD '${pw}';`);
    console.log('✅ app_user password mis à jour.');
    
    // Fix app_auth role as well
    const authMatch = process.env.AUTH_DATABASE_URL?.match(/:([^:@]+)@/);
    if (authMatch) {
      await prisma.$executeRawUnsafe(`ALTER ROLE app_auth WITH LOGIN PASSWORD '${authMatch[1]}';`);
      console.log('✅ app_auth password mis à jour.');
    }
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
