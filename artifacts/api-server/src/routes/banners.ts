import { Router, type IRouter } from "express";
import { db, bannersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/banners", requireAuth, async (req, res) => {
  try {
    const activeBanners = await db.select()
      .from(bannersTable)
      .where(eq(bannersTable.isActive, true))
      .orderBy(desc(bannersTable.createdAt));
    res.json(activeBanners);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
