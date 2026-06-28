import { Request, Response, NextFunction } from "express";
import { db, adminsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { adminTokensStore } from "../lib/tokens";

export interface AdminAuthRequest extends Request {
  adminId?: string;
  adminRole?: string;
}

export async function requireAdminAuth(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.substring(7);
  const adminId = adminTokensStore.get(token);
  if (!adminId) {
    res.status(401).json({ error: "Invalid or expired admin token" });
    return;
  }
  const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.id, adminId));
  if (!admin) {
    res.status(401).json({ error: "Admin not found" });
    return;
  }
  req.adminId = adminId;
  req.adminRole = admin.role;
  next();
}
