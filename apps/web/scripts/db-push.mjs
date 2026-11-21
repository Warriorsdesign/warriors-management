import 'dotenv/config';
import 'dotenv/config';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL est requis pour synchroniser le schéma Drizzle.');
}

let migrationUrl;
try {
  migrationUrl = new URL(databaseUrl);
  if (migrationUrl.protocol !== 'postgresql:' && migrationUrl.protocol !== 'postgres:') {
    throw new Error('Protocole invalide');
  }
} catch {
  throw new Error('DATABASE_URL doit être une URL PostgreSQL valide.');
}

migrationUrl.hostname = migrationUrl.hostname.replace(/-pooler(?=\.)/, '');

const drizzleCli = path.join(process.cwd(), 'node_modules', 'drizzle-kit', 'bin.cjs');
const result = spawnSync(process.execPath, [drizzleCli, 'push'], {
  cwd: process.cwd(),
  env: { ...process.env, DATABASE_URL: migrationUrl.toString() },
  stdio: 'inherit',
});

if (result.error) throw result.error;
if (result.status !== 0) {
  process.exitCode = result.status ?? 1;
}
