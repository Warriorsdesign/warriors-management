import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function testConnection(name: string, url?: string) {
  console.log(`\n--- Test de connexion : ${name} ---`);
  if (!url) {
    console.log('❌ URL non définie');
    return;
  }
  
  // Masquer le mot de passe
  const maskedUrl = url.replace(/:([^:@]+)@/, ':***@');
  console.log(`URL utilisée : ${maskedUrl}`);
  
  const prisma = new PrismaClient({
    datasources: { db: { url } },
    log: ['error', 'warn'],
  });

  try {
    const startTime = Date.now();
    const count = await prisma.user.count();
    const endTime = Date.now();
    console.log(`✅ Succès en ${endTime - startTime}ms. Nombre d'utilisateurs : ${count}`);
  } catch (error: any) {
    console.log(`❌ Échec : ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await testConnection('Prisma Standard (DATABASE_URL)', process.env.DATABASE_URL);
  await testConnection('Admin Prisma (DIRECT_URL)', process.env.DIRECT_URL);
  
  // Test app_user on port 5432
  if (process.env.DATABASE_URL) {
    const fallbackUrl = process.env.DATABASE_URL.replace(':6543/', ':5432/').replace('?pgbouncer=true', '');
    await testConnection('app_user direct (Port 5432)', fallbackUrl);
  }

  if (process.env.DIRECT_URL) {
    const poolerUrl = process.env.DIRECT_URL.replace(':5432/', ':6543/').concat('?pgbouncer=true');
    await testConnection('postgres on pooler (Port 6543)', poolerUrl);
  }
}

main().catch(console.error);
