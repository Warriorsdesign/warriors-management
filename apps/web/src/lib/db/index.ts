import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { NodePgTransaction } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const globalForDatabase = globalThis as unknown as {
  pool?: Pool;
};

const pool =
  globalForDatabase.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: process.env.NODE_ENV !== 'production',
  });

if (process.env.NODE_ENV !== 'production') globalForDatabase.pool = pool;

export const db = drizzle(pool, { schema });
export type Database = typeof db;
export type TenantClient = NodePgTransaction<
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export async function disconnectDatabase(): Promise<void> {
  await pool.end();
}

export async function withTenantContext<T>(
  orgId: string,
  callback: (tx: TenantClient) => Promise<T>,
  options?: { timeout?: number },
): Promise<T> {
  if (!orgId) {
    throw new Error('Tenant context requires an organization ID.');
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('Configuration PostgreSQL manquante : définissez DATABASE_URL.');
  }

  return db.transaction(
    async (tx) => {
      await tx.execute(sql.raw('SET LOCAL ROLE app_user'));
      await tx.execute(sql`SELECT set_config('app.org_id', ${orgId}, true)`);
      await tx.execute(sql`SELECT set_config('statement_timeout', ${`${options?.timeout ?? 15_000}ms`}, true)`);
      return callback(tx);
    },
  );
}
