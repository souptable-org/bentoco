const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Parse .env manually
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

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Error: DATABASE_URL is not set in .env');
  process.exit(1);
}

const migrations = [
  '0000-tenant-multi-tenancy-rls.sql',
  '0001-indian-order-state-machine-otp.sql',
  '0002-communications-wallet.sql',
  '0003-agency-schema.sql'
];

async function runMigrations() {
  const client = new Client({ connectionString });
  try {
    console.log(`Connecting to PostgreSQL database (${connectionString.replace(/:[^:@]+@/, ':****@')})...`);
    await client.connect();

    for (const file of migrations) {
      const sqlPath = path.resolve(__dirname, `../packages/bentoco/src/migration-scripts/${file}`);
      if (fs.existsSync(sqlPath)) {
        console.log(`Executing migration ${file}...`);
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        await client.query(sqlContent);
      }
    }
    console.log('Successfully executed all database migrations.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
