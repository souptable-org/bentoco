const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

async function seedAdminUser() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Seeding Default Tenant and Admin User...');

    // 1. Ensure Default Tenant
    let tenantRes = await client.query(`SELECT id FROM tenant WHERE subdomain = 'admin' LIMIT 1`);
    let tenantId;
    if (tenantRes.rows.length === 0) {
      const newTenant = await client.query(
        `INSERT INTO tenant (store_name, subdomain) VALUES ('Bentoco Default Store', 'admin') RETURNING id`
      );
      tenantId = newTenant.rows[0].id;
    } else {
      tenantId = tenantRes.rows[0].id;
    }

    // 2. Ensure Admin User
    const userId = `usr_admin_${Date.now()}`;
    const email = 'admin@bentoco.com';

    const existingUser = await client.query(`SELECT id, email FROM "user" WHERE email = $1 LIMIT 1`, [email]);
    if (existingUser.rows.length === 0) {
      await client.query(
        `INSERT INTO "user" (id, tenant_id, email, first_name, last_name, role)
         VALUES ($1, $2, $3, 'Bentoco', 'Admin', 'admin')`,
        [userId, tenantId, email]
      );
      console.log('Successfully created admin user!');
    } else {
      console.log('Admin user already exists.');
    }

    // 3. Ensure Default Agency
    const agencyRes = await client.query(`SELECT id, unique_uid FROM agency LIMIT 1`);
    if (agencyRes.rows.length === 0) {
      await client.query(
        `INSERT INTO agency (name, subdomain, unique_uid, owner_email)
         VALUES ('PixelCraft Agency', 'pixelcraft', 'AGENCY-849201', 'agency@pixelcraft.com')`
      );
      console.log('Successfully created default agency!');
    }

    console.log('\n--- SEED CREDENTIALS ---');
    console.log('Admin Email: admin@bentoco.com');
    console.log('Admin Password: (Any string or admin123 for local dev)');
    console.log('Agency UID: AGENCY-849201');
    console.log('------------------------\n');

  } catch (err) {
    console.error('Error seeding admin user:', err.message);
  } finally {
    await client.end();
  }
}

seedAdminUser();
