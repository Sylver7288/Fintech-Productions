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
      { key: "sandbox-smileid-online", desc: "SmileID KYC Verification Simulator" },
      { key: "sandbox-flutterwave-online", desc: "Flutterwave Payout Simulator" },
      { key: "sandbox-stripe-online", desc: "Stripe Card Issuance Simulator" },
      { key: "sandbox-paystack-online", desc: "Paystack Deposit Simulator" },
    ];

    const servicesList = [
      { label: "Remit", slug: "remit" },
      { label: "Products and Services", slug: "products-and-services" },
      { label: "Solar", slug: "solar" },
      { label: "Travel & Hotel", slug: "travel-hotel" },
      { label: "AliExpress", slug: "aliexpress" },
      { label: "Gift Cards", slug: "gift-cards" },
      { label: "Chowdeck", slug: "chowdeck" },
      { label: "Electricity", slug: "electricity" },
      { label: "School & Exam", slug: "school-exam" },
      { label: "Internet Services", slug: "internet-services" },
      { label: "Financial Services", slug: "financial-services" },
      { label: "Invoice Payments", slug: "invoice-payments" },
      { label: "Aid Grants and Donations", slug: "aid-grants-and-donations" },
      { label: "Religious", slug: "religious" },
      { label: "Government Payments", slug: "government-payments" },
      { label: "Embassies", slug: "embassies" },
      { label: "TV(Others)", slug: "tv-others" },
      { label: "Shopping", slug: "shopping" },
      { label: "Online Shopping", slug: "online-shopping" },
      { label: "Merchant Payments", slug: "merchant-payments" },
      { label: "Blackberry", slug: "blackberry" },
      { label: "PayChoice", slug: "paychoice" },
      { label: "Commerce Retail Trade", slug: "commerce-retail-trade" },
      { label: "Prepaid Card Services", slug: "prepaid-card-services" },
      { label: "International Airtime", slug: "international-airtime" },
      { label: "Transport & Toll", slug: "transport-toll" },
      { label: "OWealth", slug: "owealth" },
      { label: "Fixed", slug: "fixed" },
      { label: "SafeBox", slug: "safebox" },
      { label: "Targets", slug: "targets" },
      { label: "Spend & Save", slug: "spend-save" },
      { label: "BNPL", slug: "bnpl" },
      { label: "Daily Check-In", slug: "daily-check-in" },
      { label: "Play4aChild", slug: "play4achild" },
      { label: "Refer & Earn", slug: "refer-earn" },
      { label: "Physical Card", slug: "physical-card" },
      { label: "Virtual Card", slug: "virtual-card" }
    ];

    for (const item of servicesList) {
      flags.push({ key: `service-${item.slug}`, desc: `Individual service toggle for: ${item.label}` });
      flags.push({ key: `visibility-${item.slug}`, desc: `Individual visibility toggle for: ${item.label}` });
    }

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
