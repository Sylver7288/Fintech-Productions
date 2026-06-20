import { Router, type IRouter } from "express";
import { db, beneficiariesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateBeneficiaryBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { generateId } from "../lib/auth";

const router: IRouter = Router();

router.get("/beneficiaries", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const list = await db.select().from(beneficiariesTable)
    .where(eq(beneficiariesTable.userId, req.userId!));
  res.json(list);
});

router.post("/beneficiaries", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateBeneficiaryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [b] = await db.insert(beneficiariesTable).values({
    id: generateId(),
    userId: req.userId!,
    name: parsed.data.name,
    bank: parsed.data.bank,
    accountNumber: parsed.data.accountNumber,
  }).returning();
  res.status(201).json(b);
});

router.delete("/beneficiaries/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = String(req.params["id"]);
  const [deleted] = await db.delete(beneficiariesTable)
    .where(and(eq(beneficiariesTable.id, raw), eq(beneficiariesTable.userId, req.userId!)))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
