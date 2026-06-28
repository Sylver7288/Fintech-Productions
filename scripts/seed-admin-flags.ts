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
      });
      console.log(`Seeded default admin: ${defaultAdminUsername} / ${defaultAdminPassword}`);
    } else {
      console.log("Admin account already exists, skipping...");
    }

    // 2. Seed Feature Flags
    const flags = [
      { key: "transfers-enabled", isEnabled: true, description: "Allows users to perform bank transfers" },
      { key: "loans-enabled", isEnabled: true, description: "Allows users to apply for credit and view loans" },
      { key: "card-creation-enabled", isEnabled: true, description: "Allows users to generate virtual cards" },
      { key: "airtime-bills-enabled", isEnabled: true, description: "Allows users to purchase airtime and pay bills" },
    ];

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
