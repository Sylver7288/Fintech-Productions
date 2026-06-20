import { Router, type IRouter } from "express";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { createHash } from "crypto";

const router: IRouter = Router();

router.get("/referral", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;
  const code = "NOVA" + createHash("sha256").update(userId).digest("hex").slice(0, 6).toUpperCase();
  const shareUrl = `https://novapay.app/join?ref=${code}`;

  res.json({
    code,
    referredCount: 0,
    totalEarned: 0,
    pendingBonus: 0,
    shareUrl,
  });
});

export default router;
