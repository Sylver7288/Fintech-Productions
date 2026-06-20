import { Router, type IRouter } from "express";
import { db, accountsTable, transactionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { PayBillBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { generateId, generateReference } from "../lib/auth";

const router: IRouter = Router();

const CATEGORY_LABEL: Record<string, string> = {
  electricity: "Electricity",
  cable: "Cable TV",
  internet: "Internet",
  water: "Water",
};

router.post("/bills", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = PayBillBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { fromAccountId, category, provider, reference, amount } = parsed.data;

  const [account] = await db.select().from(accountsTable)
    .where(and(eq(accountsTable.id, fromAccountId), eq(accountsTable.userId, req.userId!)));

  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  if (account.status !== "active") {
    res.status(400).json({ error: "Account is not active" });
    return;
  }

  const currentBalance = parseFloat(account.balance);
  if (currentBalance < amount) {
    res.status(400).json({ error: "Insufficient funds" });
    return;
  }

  const newBalance = (currentBalance - amount).toFixed(2);
  await db.update(accountsTable).set({ balance: newBalance }).where(eq(accountsTable.id, fromAccountId));

  const label = CATEGORY_LABEL[category] ?? category;
  const description = `${provider} – ${label} payment (Ref: ${reference})`;

  const [txn] = await db.insert(transactionsTable).values({
    id: generateId(),
    accountId: fromAccountId,
    type: "debit",
    amount: amount.toFixed(2),
    currency: account.currency,
    description,
    status: "completed",
    reference: generateReference(),
    category: label,
    recipientName: provider,
    recipientBank: null,
    recipientAccount: reference,
    senderName: null,
  }).returning();

  res.status(201).json({
    ...txn,
    amount: parseFloat(txn.amount),
    recipientName: txn.recipientName ?? null,
    recipientBank: txn.recipientBank ?? null,
    recipientAccount: txn.recipientAccount ?? null,
    senderName: txn.senderName ?? null,
    category: txn.category ?? null,
  });
});

export default router;
