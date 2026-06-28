import fs from "fs";
import path from "path";
import { logger } from "./logger";

const KEYS_FILE = path.resolve(process.cwd(), "gateway-keys.json");

function getKeys() {
  if (fs.existsSync(KEYS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(KEYS_FILE, "utf-8"));
    } catch {
      return {};
    }
  }
  return {};
}

export interface EasyPayTransferPayload {
  amount: number;
  recipientAccount: string;
  recipientBank: string;
  recipientName: string;
  reference: string;
  description: string;
}

// 1. Name Enquiry method (to check account name before transfer)
export async function nameEnquiry(accountNumber: string, bankCode: string): Promise<{ success: boolean; accountName?: string; error?: string }> {
  const keys = getKeys();
  const apiKey = keys.nibssEasyPayClientKey || process.env.NIBSS_EASYPAY_CLIENT_KEY;
  const isSandbox = !apiKey || keys.nibssEasyPaySandbox !== false;

  logger.info({ accountNumber, bankCode, isSandbox }, "Running NIBSS EasyPay Name Enquiry");

  if (isSandbox) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (accountNumber.startsWith("000")) {
      return { success: false, error: "Account not found in NIBSS registry (simulated)" };
    }
    return { success: true, accountName: "MOCK BENEFICIARY ACCOUNT" };
  }

  try {
    const response = await fetch("https://api.nibss-plc.com.ng/easypay/v1/name-enquiry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "X-Sponsor-Code": keys.nibssEasyPaySponsorCode || "",
      },
      body: JSON.stringify({ accountNumber, bankCode }),
    });

    const data: any = await response.json();
    if (!response.ok || data.responseCode !== "00") {
      return { success: false, error: data.responseMessage || `NIBSS Name Enquiry returned error code ${response.status}` };
    }

    return { success: true, accountName: data.accountName };
  } catch (err: any) {
    logger.error({ err, accountNumber }, "Fatal error during NIBSS Name Enquiry");
    return { success: false, error: err.message || "Failed to contact NIBSS Name Enquiry gateway" };
  }
}

// 2. Fund Transfer execution method
export async function executeEasyPayTransfer(payload: EasyPayTransferPayload): Promise<{ success: boolean; sessionID?: string; error?: string }> {
  const keys = getKeys();
  const apiKey = keys.nibssEasyPayClientKey || process.env.NIBSS_EASYPAY_CLIENT_KEY;
  const isSandbox = !apiKey || keys.nibssEasyPaySandbox !== false;

  logger.info({ reference: payload.reference, isSandbox }, "Initiating NIBSS EasyPay API Transfer");

  if (isSandbox) {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (payload.recipientAccount === "0000000000") {
      logger.warn({ reference: payload.reference }, "Simulating EasyPay Transfer failure for test account");
      return { success: false, error: "NIBSS Error: Invalid recipient account details (simulated)" };
    }

    const sessionID = "999" + Date.now() + Math.floor(Math.random() * 100000).toString().padStart(5, "0");
    logger.info({ reference: payload.reference, sessionID }, "EasyPay simulation transaction succeeded");
    return { success: true, sessionID };
  }

  try {
    const response = await fetch("https://api.nibss-plc.com.ng/easypay/v1/transfer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "X-Sponsor-Code": keys.nibssEasyPaySponsorCode || "",
      },
      body: JSON.stringify({
        sessionID: payload.reference,
        amount: payload.amount.toString(),
        destinationAccountNumber: payload.recipientAccount,
        destinationBankCode: payload.recipientBank,
        beneficiaryName: payload.recipientName,
        narration: payload.description,
      }),
    });

    const data: any = await response.json();
    if (!response.ok || data.responseCode !== "00") {
      return { 
        success: false, 
        error: data.responseMessage || `NIBSS API returned error code ${data.responseCode || response.status}` 
      };
    }

    return { success: true, sessionID: data.sessionID };
  } catch (err: any) {
    logger.error({ err, reference: payload.reference }, "Fatal error calling NIBSS EasyPay API");
    return { success: false, error: err.message || "Failed to contact NIBSS EasyPay gateway" };
  }
}

// 3. Transaction Status Query method
export async function queryTransferStatus(reference: string): Promise<{ success: boolean; status: "completed" | "failed" | "pending"; error?: string }> {
  const keys = getKeys();
  const apiKey = keys.nibssEasyPayClientKey || process.env.NIBSS_EASYPAY_CLIENT_KEY;
  const isSandbox = !apiKey || keys.nibssEasyPaySandbox !== false;

  logger.info({ reference, isSandbox }, "Querying NIBSS EasyPay Transaction Status");

  if (isSandbox) {
    await new Promise(resolve => setTimeout(resolve, 300));
    if (reference.endsWith("F")) return { success: true, status: "failed" };
    if (reference.endsWith("P")) return { success: true, status: "pending" };
    return { success: true, status: "completed" };
  }

  try {
    const response = await fetch(`https://api.nibss-plc.com.ng/easypay/v1/transfer/status?reference=${reference}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "X-Sponsor-Code": keys.nibssEasyPaySponsorCode || "",
      },
    });

    const data: any = await response.json();
    if (!response.ok) {
      return { success: false, status: "pending", error: `NIBSS Status Query failed: HTTP ${response.status}` };
    }

    if (data.responseCode === "00") {
      return { success: true, status: "completed" };
    } else if (data.responseCode === "09" || data.responseCode === "PD") {
      return { success: true, status: "pending" };
    } else {
      return { success: true, status: "failed", error: data.responseMessage || "NIBSS reported transfer failure" };
    }
  } catch (err: any) {
    logger.error({ err, reference }, "Fatal error calling NIBSS EasyPay Status Query");
    return { success: false, status: "pending", error: err.message };
  }
}
