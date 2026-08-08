const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...vals] = trimmed.split('=');
      process.env[key.trim()] = vals.join('=').trim();
    }
  }
}

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/bentoco';

async function checkUsers() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query('SELECT * FROM "user"');
    console.log('USER_COUNT:', res.rows.length);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error fetching users:', err.message);
  } finally {
    await client.end();
  }
}

checkUsers();
