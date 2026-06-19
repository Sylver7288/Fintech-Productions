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

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
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
