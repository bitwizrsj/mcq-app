const { Client } = require('pg');

async function testConnection() {
  const connectionString = 'postgresql://postgres:%AGJ_7y+9j$vwun@db.ulzhgbujdcfytbxvuyaa.supabase.co:5432/postgres';
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log("Connection successful!");
    const res = await client.query('SELECT NOW()');
    console.log(res.rows[0]);
    await client.end();
  } catch (err) {
    console.error("Connection failed:", err.message);
  }
}

testConnection();
