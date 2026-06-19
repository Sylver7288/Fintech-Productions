import { Router, type IRouter } from "express";
import { db, cardsTable, accountsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateCardBody, FreezeCardBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { generateId } from "../lib/auth";

const router: IRouter = Router();

router.get("/cards", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const cards = await db.select().from(cardsTable).where(eq(cardsTable.userId, req.userId!));
  res.json(cards.map(c => ({ ...c, color: c.color ?? null })));
});

router.post("/cards", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateCardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { accountId, type, color } = parsed.data;

  // Verify account belongs to user
  const [account] = await db.select().from(accountsTable)
    .where(and(eq(accountsTable.id, accountId), eq(accountsTable.userId, req.userId!)));
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  const now = new Date();
  const expiryYear = (now.getFullYear() + 4).toString();
  const expiryMonth = String(now.getMonth() + 1).padStart(2, "0");
  const last4 = Math.floor(1000 + Math.random() * 9000).toString();

  const [userRow] = await db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName })
    .from(usersTable).where(eq(usersTable.id, req.userId!));

  const cardHolder = `${userRow?.firstName ?? "Card"} ${userRow?.lastName ?? "Holder"}`.toUpperCase();

  const [card] = await db.insert(cardsTable).values({
    id: generateId(),
    userId: req.userId!,
    accountId,
    type: type ?? "virtual",
    last4,
    expiryMonth,
    expiryYear,
    status: "active",
    cardHolder,
    color: color ?? "#6C5CE7",
  }).returning();

  res.status(201).json({ ...card, color: card.color ?? null });
});

router.get("/cards/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [card] = await db.select().from(cardsTable)
    .where(and(eq(cardsTable.id, raw), eq(cardsTable.userId, req.userId!)));
  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }
  res.json({ ...card, color: card.color ?? null });
});

router.patch("/cards/:id/freeze", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = FreezeCardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [card] = await db.update(cardsTable)
    .set({ status: parsed.data.frozen ? "frozen" : "active" })
    .where(and(eq(cardsTable.id, raw), eq(cardsTable.userId, req.userId!)))
    .returning();

  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }
  res.json({ ...card, color: card.color ?? null });
});

export default router;
