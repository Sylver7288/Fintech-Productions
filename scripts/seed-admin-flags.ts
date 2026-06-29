import { db, adminsTable, featureFlagsTable } from "../lib/db/src/index";
import crypto from "crypto";

// Matches the scrypt logic from artifacts/api-server/src/lib/auth.ts
function hashPassword(password: string): string {
  const salt = "supersecretfallbacksaltforlocaldev";
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function seed() {
  console.log("Seeding database with admin account and feature flags...");

  try {
    // 1. Seed Admin Account
    const defaultAdminUsername = "admin";
    const defaultAdminPassword = "AdminPass123!";
    const passwordHash = hashPassword(defaultAdminPassword);

    const existingAdmin = await db.select()
      .from(adminsTable)
      .where(eq(adminsTable.username, defaultAdminUsername))
      .limit(1);

    if (existingAdmin.length === 0) {
      await db.insert(adminsTable).values({
        id: crypto.randomUUID(),
        username: defaultAdminUsername,
        passwordHash,
        role: "superadmin",
      });
      console.log(`Seeded default admin: ${defaultAdminUsername} / ${defaultAdminPassword}`);
    } else {
      // Ensure the default admin is updated to superadmin
      await db.update(adminsTable)
        .set({ role: "superadmin" })
        .where(eq(adminsTable.username, defaultAdminUsername));
      console.log("Admin account already exists. Ensured it has 'superadmin' role.");
    }

    // 2. Seed Feature Flags
    const flags = [
      { key: "transfers-enabled", isEnabled: true, description: "Allows users to perform bank transfers" },
      { key: "loans-enabled", isEnabled: true, description: "Allows users to apply for credit and view loans" },
      { key: "card-creation-enabled", isEnabled: true, description: "Allows users to generate virtual cards" },
      { key: "airtime-bills-enabled", isEnabled: true, description: "Allows users to purchase airtime and pay bills" },
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
      flags.push({ key: `service-${item.slug}`, isEnabled: true, description: `Individual service toggle for: ${item.label}` });
      flags.push({ key: `visibility-${item.slug}`, isEnabled: true, description: `Individual visibility toggle for: ${item.label}` });
    }

    for (const flag of flags) {
      const existingFlag = await db.select()
        .from(featureFlagsTable)
        .where(eq(featureFlagsTable.key, flag.key))
        .limit(1);

      if (existingFlag.length === 0) {
        await db.insert(featureFlagsTable).values({
          id: crypto.randomUUID(),
          key: flag.key,
          isEnabled: flag.isEnabled,
          description: flag.description,
        });
        console.log(`Seeded feature flag: ${flag.key}`);
      } else {
        console.log(`Feature flag ${flag.key} already exists, skipping...`);
      }
    }

    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

// Simple query helper to avoid needing imports from drizzle-orm directly in script
import { eq } from "drizzle-orm";

seed();
