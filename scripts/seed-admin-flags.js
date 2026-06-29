const pg = require('pg');
const crypto = require('crypto');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL must be set.");
  process.exit(1);
}

function hashPassword(password) {
  const salt = "supersecretfallbacksaltforlocaldev";
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function seed() {
  console.log("Seeding database with admin account and feature flags...");
  const pool = new pg.Pool({ connectionString: databaseUrl });
  try {
    const client = await pool.connect();
    
    // Seed Admin
    const passHash = hashPassword("AdminPass123!");
    await client.query(`
      INSERT INTO admins (id, username, password_hash, role, created_at, updated_at)
      VALUES ($1, $2, $3, 'superadmin', NOW(), NOW())
      ON CONFLICT (username) DO UPDATE SET role = 'superadmin'
    `, [crypto.randomUUID(), 'admin', passHash]);
    console.log("Seeded and verified admin user has 'superadmin' role.");

    // Seed Flags
    const flags = [
      { key: "transfers-enabled", desc: "Allows users to perform bank transfers" },
      { key: "loans-enabled", desc: "Allows users to apply for credit and view loans" },
      { key: "card-creation-enabled", desc: "Allows users to generate virtual cards" },
      { key: "airtime-bills-enabled", desc: "Allows users to purchase airtime and pay bills" },
    ];

    for (const flag of flags) {
      await client.query(`
        INSERT INTO feature_flags (id, key, is_enabled, description, updated_at)
        VALUES ($1, $2, TRUE, $3, NOW())
        ON CONFLICT (key) DO NOTHING
      `, [crypto.randomUUID(), flag.key, flag.desc]);
      console.log(`Seeded flag: ${flag.key}`);
    }

    client.release();
    await pool.end();
    console.log("Seeding finished successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err.message);
    process.exit(1);
  }
}

seed();
