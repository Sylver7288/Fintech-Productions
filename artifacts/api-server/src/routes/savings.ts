import { Router, type IRouter } from "express";
import { db, savingsTable, accountsTable, transactionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateSavingsBody, UpdateSavingsBody, TopUpSavingsBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { generateId, generateReference } from "../lib/auth";

const router: IRouter = Router();

function formatSavings(s: typeof savingsTable.$inferSelect) {
  return {
    ...s,
    targetAmount: parseFloat(s.targetAmount),
    currentAmount: parseFloat(s.currentAmount),
    emoji: s.emoji ?? null,
    color: s.color ?? null,
    targetDate: s.targetDate ?? null,
  };
}

router.get("/savings", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const goals = await db.select().from(savingsTable).where(eq(savingsTable.userId, req.userId!));
  res.json(goals.map(formatSavings));
});

router.post("/savings", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateSavingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [goal] = await db.insert(savingsTable).values({
    id: generateId(),
    userId: req.userId!,
    name: parsed.data.name,
    targetAmount: String(parsed.data.targetAmount),
    currentAmount: "0",
    currency: "NGN",
    emoji: parsed.data.emoji ?? null,
    color: parsed.data.color ?? null,
    status: "active",
    targetDate: parsed.data.targetDate ?? null,
  }).returning();
  res.status(201).json(formatSavings(goal));
});

router.get("/savings/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [goal] = await db.select().from(savingsTable)
    .where(and(eq(savingsTable.id, raw), eq(savingsTable.userId, req.userId!)));
  if (!goal) {
    res.status(404).json({ error: "Savings goal not found" });
    return;
  }
  res.json(formatSavings(goal));
});

router.patch("/savings/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = UpdateSavingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  if (parsed.data.name) updateData.name = parsed.data.name;
  if (parsed.data.targetAmount) updateData.targetAmount = String(parsed.data.targetAmount);
  if (parsed.data.emoji !== undefined) updateData.emoji = parsed.data.emoji;
  if (parsed.data.color !== undefined) updateData.color = parsed.data.color;
  if (parsed.data.targetDate !== undefined) updateData.targetDate = parsed.data.targetDate;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;

  const [goal] = await db.update(savingsTable)
    .set(updateData)
    .where(and(eq(savingsTable.id, raw), eq(savingsTable.userId, req.userId!)))
    .returning();
  if (!goal) {
    res.status(404).json({ error: "Savings goal not found" });
    return;
  }
  res.json(formatSavings(goal));
});

router.delete("/savings/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [deleted] = await db.delete(savingsTable)
    .where(and(eq(savingsTable.id, raw), eq(savingsTable.userId, req.userId!)))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Savings goal not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/savings/:id/topup", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = TopUpSavingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { amount, fromAccountId } = parsed.data;

  const [account] = await db.select().from(accountsTable)
    .where(and(eq(accountsTable.id, fromAccountId), eq(accountsTable.userId, req.userId!)));
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  if (parseFloat(account.balance) < amount) {
    res.status(400).json({ error: "Insufficient funds" });
    return;
  }

  const [goal] = await db.select().from(savingsTable)
    .where(and(eq(savingsTable.id, raw), eq(savingsTable.userId, req.userId!)));
  if (!goal) {
    res.status(404).json({ error: "Savings goal not found" });
    return;
  }

  const newAccountBalance = (parseFloat(account.balance) - amount).toFixed(2);
  const newSavingsAmount = (parseFloat(goal.currentAmount) + amount).toFixed(2);
  const newStatus = parseFloat(newSavingsAmount) >= parseFloat(goal.targetAmount) ? "completed" : goal.status;

  await db.update(accountsTable).set({ balance: newAccountBalance }).where(eq(accountsTable.id, fromAccountId));
  const [updated] = await db.update(savingsTable)
    .set({ currentAmount: newSavingsAmount, status: newStatus })
    .where(eq(savingsTable.id, raw))
    .returning();

  // Record transaction
  await db.insert(transactionsTable).values({
    id: generateId(),
    accountId: fromAccountId,
    type: "debit",
    amount: amount.toFixed(2),
    currency: account.currency,
    description: `Savings top-up: ${goal.name}`,
    status: "completed",
    reference: generateReference(),
    category: "Savings",
    senderName: null,
    recipientName: goal.name,
    recipientBank: null,
    recipientAccount: null,
  });

  res.json(formatSavings(updated));
});

export default router;
