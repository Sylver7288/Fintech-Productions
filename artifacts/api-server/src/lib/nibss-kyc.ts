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

export interface VerificationResult {
  success: boolean;
  message: string;
  details?: {
    firstName: string;
    lastName: string;
    dob: string;
    phone?: string;
  };
}

export async function verifyBVN(bvn: string, firstName: string, lastName: string, dob: string): Promise<VerificationResult> {
  const keys = getKeys();
  const apiKey = keys.nibssKycApiKey || process.env.NIBSS_KYC_API_KEY;
  const isSandbox = !apiKey || keys.nibssKycSandbox !== false;

  logger.info({ bvn, isSandbox }, "Verifying BVN via NIBSS KYC API");

  if (isSandbox) {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
    
    // Simulate invalid BVNs starting with '000'
    if (bvn.startsWith("000")) {
      return { success: false, message: "Invalid BVN: Record not found in NIBSS registry (Mock)" };
    }

    return { 
      success: true, 
      message: "BVN verified successfully (Mock Sandbox)",
      details: { firstName, lastName, dob }
    };
  }

  try {
    const response = await fetch("https://api.nibss-plc.com.ng/kyc/v1/bvn/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ bvn }),
    });

    const data: any = await response.json();
    if (!response.ok || data.responseCode !== "00") {
      return { success: false, message: data.responseMessage || `NIBSS BVN API returned error code ${response.status}` };
    }

    // Compare names case-insensitively
    const remoteFirstName = (data.data.firstName || "").trim().toLowerCase();
    const remoteLastName = (data.data.lastName || "").trim().toLowerCase();
    const localFirstName = firstName.trim().toLowerCase();
    const localLastName = lastName.trim().toLowerCase();

    const namesMatch = remoteFirstName.includes(localFirstName) || localFirstName.includes(remoteFirstName) ||
                       remoteLastName.includes(localLastName) || localLastName.includes(remoteLastName);

    if (!namesMatch) {
      return { 
        success: false, 
        message: `BVN verification mismatch: Provided name does not match NIBSS registry records.` 
      };
    }

    return {
      success: true,
      message: "BVN verified successfully via NIBSS",
      details: {
        firstName: data.data.firstName,
        lastName: data.data.lastName,
        dob: data.data.dateOfBirth,
        phone: data.data.phoneNumber
      }
    };
  } catch (err: any) {
    logger.error({ err, bvn }, "Fatal error calling NIBSS BVN API");
    return { success: false, message: err.message || "Failed to contact NIBSS BVN Verification gateway" };
  }
}

export async function verifyNIN(nin: string, firstName: string, lastName: string, dob: string): Promise<VerificationResult> {
  const keys = getKeys();
  const apiKey = keys.nibssKycApiKey || process.env.NIBSS_KYC_API_KEY;
  const isSandbox = !apiKey || keys.nibssKycSandbox !== false;

  logger.info({ nin, isSandbox }, "Verifying NIN via NIBSS KYC API");

  if (isSandbox) {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (nin.startsWith("000")) {
      return { success: false, message: "Invalid NIN: Record not found in NIMC registry (Mock)" };
    }

    return { 
      success: true, 
      message: "NIN verified successfully (Mock Sandbox)",
      details: { firstName, lastName, dob }
    };
  }

  try {
    const response = await fetch("https://api.nibss-plc.com.ng/kyc/v1/nin/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ nin }),
    });

    const data: any = await response.json();
    if (!response.ok || data.responseCode !== "00") {
      return { success: false, message: data.responseMessage || `NIBSS NIN API returned error code ${response.status}` };
    }

    // Match names
    const remoteFirstName = (data.data.firstname || "").trim().toLowerCase();
    const remoteLastName = (data.data.surname || "").trim().toLowerCase();
    const localFirstName = firstName.trim().toLowerCase();
    const localLastName = lastName.trim().toLowerCase();

    const namesMatch = remoteFirstName.includes(localFirstName) || localFirstName.includes(remoteFirstName) ||
                       remoteLastName.includes(localLastName) || localLastName.includes(remoteLastName);

    if (!namesMatch) {
      return { 
        success: false, 
        message: `NIN verification mismatch: Provided name does not match NIMC registry records.` 
      };
    }

    return {
      success: true,
      message: "NIN verified successfully via NIBSS/NIMC",
      details: {
        firstName: data.data.firstname,
        lastName: data.data.surname,
        dob: data.data.birthdate,
        phone: data.data.telephoneno
      }
    };
  } catch (err: any) {
    logger.error({ err, nin }, "Fatal error calling NIBSS NIN API");
    return { success: false, message: err.message || "Failed to contact NIBSS NIN Verification gateway" };
  }
}
