const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.gzekrgzqrlzqopjpzqom:tNk0FIsDU06dDHeR@aws-1-eu-west-1.pooler.supabase.com:5432/postgres' });
async function run() {
  await client.connect();
  const res = await client.query('SELECT matricule, status FROM "User" LIMIT 5');
  console.log(res.rows);
  await client.end();
}
run().catch(console.error);
