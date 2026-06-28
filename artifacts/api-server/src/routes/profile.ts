import { Router, type IRouter } from "express";
import { db, usersTable, notificationsTable, supportSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateProfileBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { generateId } from "../lib/auth";
import { verifyBVN, verifyNIN } from "../lib/nibss-kyc";

const router: IRouter = Router();

router.get("/profile", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const { passwordHash: _ph, ...safeUser } = user;
  res.json({ ...safeUser, avatarUrl: safeUser.avatarUrl ?? null, bvn: safeUser.bvn ?? null, nin: safeUser.nin ?? null });
});

router.patch("/profile", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let updateData = { ...parsed.data } as any;

  // 1. Live NIBSS BVN Verification Integration
  if (updateData.bvn) {
    const [currentUser] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
    if (!currentUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const result = await verifyBVN(
      updateData.bvn,
      currentUser.firstName,
      currentUser.lastName,
      "1990-01-01" // Mock registry DOB check
    );
    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }
    updateData.kycStatus = "approved";
  }

  // 2. Live NIBSS NIN Verification Integration
  if (updateData.nin) {
    const [currentUser] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
    if (!currentUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const result = await verifyNIN(
      updateData.nin,
      currentUser.firstName,
      currentUser.lastName,
      "1990-01-01"
    );
    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }
    updateData.kycStatus = "approved";
  }

  const [user] = await db.update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, req.userId!))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // 3. Log Success Notifications
  if (updateData.bvn || updateData.nin) {
    try {
      const type = updateData.bvn ? "BVN" : "NIN";
      await db.insert(notificationsTable).values({
        id: generateId(),
        userId: req.userId!,
        title: "KYC Verified",
        message: `Your ${type} has been successfully verified via NIBSS. Full account features are now unlocked.`,
        type: "kyc",
      });
    } catch (err) {
      // Fallback
    }
  }

  const { passwordHash: _ph, ...safeUser } = user;
  res.json({ ...safeUser, avatarUrl: safeUser.avatarUrl ?? null, bvn: safeUser.bvn ?? null, nin: safeUser.nin ?? null });
});

router.get("/support-settings", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  try {
    const [settings] = await db.select().from(supportSettingsTable).where(eq(supportSettingsTable.id, "global")).limit(1);
    if (!settings) {
      res.status(404).json({ error: "Support settings not found" });
      return;
    }
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
