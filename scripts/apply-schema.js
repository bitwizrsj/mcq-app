const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");
const env = fs.readFileSync(envPath, "utf8");
const match = env.match(/DATABASE_URL="([^"]+)"/);

if (!match) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(1);
}

const sql = fs.readFileSync(path.join(root, "supabase-schema.sql"), "utf8");

async function main() {
  const client = new Client({
    connectionString: match[1],
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Connected to Supabase Postgres");

  await client.query(sql);
  console.log("Schema applied successfully");

  const { rows } = await client.query(`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name in ('projects', 'mcq_sets', 'questions', 'leaderboard')
    order by 1
  `);
  console.log("Tables:", rows.map((r) => r.table_name).join(", "));

  await client.end();
}

main().catch((err) => {
  console.error("Failed to apply schema:", err.message);
  process.exit(1);
});
