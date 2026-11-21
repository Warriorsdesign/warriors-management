import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL est requis pour appliquer la migration de compatibilité.');
}

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const migrationPath = path.join(scriptDirectory, '../db/migrations/2026-11-updated-at-defaults.sql');
const migration = await readFile(migrationPath, 'utf8');
let migrationUrl;
try {
  migrationUrl = new URL(process.env.DATABASE_URL);
  if (migrationUrl.protocol !== 'postgresql:' && migrationUrl.protocol !== 'postgres:') {
    throw new Error('Protocole invalide');
  }
} catch {
  throw new Error('DATABASE_URL doit être une URL PostgreSQL valide.');
}
migrationUrl.hostname = migrationUrl.hostname.replace(/-pooler(?=\.)/, '');
const pool = new pg.Pool({ connectionString: migrationUrl.toString(), max: 1 });

try {
  await pool.query(migration);
  console.log('Migration des valeurs par défaut updatedAt appliquée.');
} finally {
  await pool.end();
}
