import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import router from "./routes";
import { logger } from "./lib/logger";
import { db, featureFlagsTable, supportSettingsTable, cardsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const app: Express = express();

// Programmatic self-healing feature flags seeding
async function ensureFeatureFlags() {
  try {
    const requiredFlags = [
      { key: "sandbox-smileid-online", description: "SmileID KYC Verification Simulator" },
      { key: "sandbox-flutterwave-online", description: "Flutterwave Payout Simulator" },
      { key: "sandbox-stripe-online", description: "Stripe Card Issuance Simulator" },
      { key: "sandbox-paystack-online", description: "Paystack Deposit Simulator" }
    ];

    for (const flag of requiredFlags) {
      const [existing] = await db.select().from(featureFlagsTable).where(eq(featureFlagsTable.key, flag.key)).limit(1);
      if (!existing) {
        await db.insert(featureFlagsTable).values({
          id: crypto.randomUUID(),
          key: flag.key,
          isEnabled: true,
          description: flag.description
        });
        logger.info({ key: flag.key }, "Successfully seeded missing feature flag");
      }
    }
  } catch (err: any) {
    logger.error({ err }, "Error checking or seeding feature flags");
  }
}

// Ensure support settings row exists
async function ensureSupportSettings() {
  try {
    const [existing] = await db.select().from(supportSettingsTable).where(eq(supportSettingsTable.id, "global")).limit(1);
    if (!existing) {
      await db.insert(supportSettingsTable).values({
        id: "global",
        email: "support@novamoni.ng",
        whatsapp: "https://wa.me/2348000000000",
        liveChatUrl: "https://example.com/live-chat"
      });
      logger.info("Successfully seeded global support settings");
    }
  } catch (err: any) {
    logger.error({ err }, "Error checking or seeding support settings");
  }
}

// Update legacy card colors in database to match the brand
async function updateLegacyCardColors() {
  try {
    const legacyColors = ["#6C5CE7", "#0984E3", "#00B894", "#E17055"];
    for (const color of legacyColors) {
      await db.update(cardsTable).set({ color: "#300010" }).where(eq(cardsTable.color, color));
    }
    logger.info("Successfully updated legacy card colors in database");
  } catch (err: any) {
    logger.error({ err }, "Error checking or seeding card colors");
  }
}

// Run async check on initialization
ensureFeatureFlags();
ensureSupportSettings();
updateLegacyCardColors();

// Use Helmet to secure HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Apply rate limiting to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300, // Limit each IP to 300 requests per window (high limit for local dev/testing)
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, please try again after 15 minutes." }
});
app.use(limiter);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
