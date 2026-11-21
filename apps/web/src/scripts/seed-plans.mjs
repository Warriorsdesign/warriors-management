import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL est requis pour initialiser les forfaits.');
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const plans = [
  { name: 'STARTER', description: 'Idéal pour commencer', price: 0, maxCenters: 1, maxStudents: 50, isPopular: false },
  { name: 'PRO', description: 'Pour les structures en croissance', price: 29.99, maxCenters: 3, maxStudents: 200, isPopular: true },
  { name: 'ENTERPRISE', description: 'Pour les grands réseaux', price: 99.99, maxCenters: 10, maxStudents: 1000, isPopular: false },
];

try {
  for (const plan of plans) {
    await pool.query(
      `INSERT INTO "Plan" (
         "id", "name", "description", "price", "maxCenters", "maxStudents", "isPopular",
         "createdAt", "updatedAt"
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT ("name") DO UPDATE SET
         "description" = EXCLUDED."description",
         "price" = EXCLUDED."price",
         "maxCenters" = EXCLUDED."maxCenters",
         "maxStudents" = EXCLUDED."maxStudents",
         "isPopular" = EXCLUDED."isPopular",
         "updatedAt" = CURRENT_TIMESTAMP`,
      [randomUUID(), plan.name, plan.description, plan.price, plan.maxCenters, plan.maxStudents, plan.isPopular],
    );
  }
  console.log('Forfaits par défaut initialisés.');
} finally {
  await pool.end();
}
