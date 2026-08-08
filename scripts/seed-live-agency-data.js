const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/bentoco";

async function seedLiveData() {
  const client = new Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    console.log("Connected to PostgreSQL database:", DATABASE_URL);

    // Clear previous seed agency to avoid unique constraint conflicts
    await client.query(`DELETE FROM agency WHERE subdomain = 'pixelcraft' OR unique_uid = 'AGENCY-849201';`);

    const agencyUuid = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

    // 1. Insert Agency Master
    await client.query(`
      INSERT INTO agency (id, name, subdomain, unique_uid, owner_email, master_uid, created_at)
      VALUES ($1, 'PixelCraft Digital Agency', 'pixelcraft', 'AGENCY-849201', 'admin@bentoco.com', 'AGENCY-849201', NOW());
    `, [agencyUuid]);

    // 2. Insert Live Stores
    const liveStores = [
      { id: "store_live_01", name: "Urban Threads Apparel", currency: "usd" },
      { id: "store_live_02", name: "Apex Tactical Gear", currency: "usd" },
      { id: "store_live_03", name: "LuxeLiving Home & Decor", currency: "usd" },
      { id: "store_live_04", name: "Aura Skincare & Cosmetics", currency: "usd" },
      { id: "store_live_05", name: "Zenith Electronics & Tech", currency: "usd" },
    ];

    for (const store of liveStores) {
      await client.query(
        `INSERT INTO store (id, name, default_currency_code, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (id) DO UPDATE SET name = $2;`,
        [store.id, store.name, store.currency]
      );

      await client.query(
        `INSERT INTO ownership_status (store_id, agency_id, status)
         VALUES ($1, $2, 'AGENCY_MANAGED');`,
        [store.id, agencyUuid]
      );
    }

    console.log("SUCCESS: Live PostgreSQL store records inserted successfully!");
  } catch (err) {
    console.error("Failed to seed live database:", err.message);
  } finally {
    await client.end();
  }
}

seedLiveData();
