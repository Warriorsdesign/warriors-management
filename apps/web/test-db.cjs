const { Client } = require('pg');

async function check() {
  const url = process.env.URL || "postgresql://postgres.gzekrgzqrlzqopjpzqom:tNk0FIsDU06dDHeR@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
  const client = new Client({ connectionString: url });
  
  try {
    console.log("Connecting...");
    await client.connect();
    const res = await client.query('SELECT NOW()');
    console.log("Connected successfully! Time:", res.rows[0].now);
  } catch (err) {
    console.error("Connection error:", err);
  } finally {
    await client.end();
  }
}

check();
