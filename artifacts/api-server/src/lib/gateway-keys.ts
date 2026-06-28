import fs from "fs";
import path from "path";

const KEYS_FILE = path.resolve(process.cwd(), "gateway-keys.json");

export interface GatewayKeys {
  paystackPublicKey?: string;
  paystackSecretKey?: string;
  flutterwavePublicKey?: string;
  flutterwaveSecretKey?: string;
  stripeSecretKey?: string;
  smileIdApiKey?: string;
  sudoApiKey?: string;
  bridgecardApiKey?: string;
}

export function readKeys(): GatewayKeys {
  if (!fs.existsSync(KEYS_FILE)) {
    return {
      paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || "",
      paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || "",
      flutterwavePublicKey: process.env.FLUTTERWAVE_PUBLIC_KEY || "",
      flutterwaveSecretKey: process.env.FLUTTERWAVE_SECRET_KEY || "",
      stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
      smileIdApiKey: process.env.SMILE_ID_API_KEY || "",
      sudoApiKey: process.env.SUDO_API_KEY || "",
      bridgecardApiKey: process.env.BRIDGECARD_API_KEY || "",
    };
  }
  try {
    const raw = fs.readFileSync(KEYS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return {};
  }
}

export function writeKeys(keys: GatewayKeys): boolean {
  try {
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2), "utf-8");
    return true;
  } catch (err) {
    return false;
  }
}
