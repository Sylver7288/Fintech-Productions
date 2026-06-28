import crypto from "crypto";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const inputHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return hash === inputHash;
}

const SECRET = process.env.SESSION_SECRET || "novamoni-super-secret-hmac-key-2026";

export function generateToken(payload: string): string {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const data = Buffer.from(JSON.stringify({ payload, expiresAt })).toString("base64url");
  const signature = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function verifyAndDecodeToken(token: string): string | undefined {
  if (!token) return undefined;
  const parts = token.split(".");
  if (parts.length !== 2) return undefined;
  const [data, signature] = parts;
  const expectedSignature = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  if (signature !== expectedSignature) return undefined;
  try {
    const { payload, expiresAt } = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (Date.now() > expiresAt) return undefined;
    return payload;
  } catch {
    return undefined;
  }
}

export function generateId(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function generateAccountNumber(): string {
  const digits = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  return digits;
}

export function generateReference(): string {
  return `TXN${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}
