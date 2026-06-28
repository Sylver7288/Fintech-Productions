import { Router, type IRouter } from "express";
import { db, accountsTable, transactionsTable, savingsTable, featureFlagsTable, notificationsTable } from "@workspace/db";
import { eq, and, gte, lte, sum, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { generateId, generateReference } from "../lib/auth";

const router: IRouter = Router();

router.get("/accounts", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const accounts = await db.select().from(accountsTable)
    .where(eq(accountsTable.userId, req.userId!))
    .orderBy(accountsTable.createdAt);

  res.json(accounts.map(a => ({
    ...a,
    balance: parseFloat(a.balance),
    bankName: a.bankName ?? null,
  })));
});

router.get("/accounts/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [account] = await db.select().from(accountsTable)
    .where(and(eq(accountsTable.id, raw), eq(accountsTable.userId, req.userId!)));
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  res.json({ ...account, balance: parseFloat(account.balance), bankName: account.bankName ?? null });
});

router.get("/dashboard/summary", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const accounts = await db.select().from(accountsTable).where(eq(accountsTable.userId, req.userId!));
  const totalBalance = accounts.reduce((sum, a) => sum + parseFloat(a.balance), 0);

  // Get current month start
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get all account ids for this user
  const accountIds = accounts.map(a => a.id);

  let monthlySpend = 0;
  let monthlyIncome = 0;

  if (accountIds.length > 0) {
    for (const accountId of accountIds) {
      const txns = await db.select().from(transactionsTable)
        .where(and(
          eq(transactionsTable.accountId, accountId),
          gte(transactionsTable.createdAt, monthStart),
          eq(transactionsTable.status, "completed")
        ));
      for (const t of txns) {
        if (t.type === "debit") monthlySpend += parseFloat(t.amount);
        if (t.type === "credit") monthlyIncome += parseFloat(t.amount);
      }
    }
  }

  // Get all savings
  const savings = await db.select().from(savingsTable).where(eq(savingsTable.userId, req.userId!));
  const savingsTotal = savings.reduce((s, g) => s + parseFloat(g.currentAmount), 0);

  // Get recent transactions
  const recentTransactions: typeof transactionsTable.$inferSelect[] = [];
  for (const accountId of accountIds) {
    const txns = await db.select().from(transactionsTable)
      .where(eq(transactionsTable.accountId, accountId))
      .orderBy(desc(transactionsTable.createdAt))
      .limit(5);
    recentTransactions.push(...txns);
  }
  recentTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const top10 = recentTransactions.slice(0, 10);

  // Spending by category
  const categoryMap: Record<string, number> = {};
  for (const txn of recentTransactions.filter(t => t.type === "debit" && t.category)) {
    const cat = txn.category!;
    categoryMap[cat] = (categoryMap[cat] ?? 0) + parseFloat(txn.amount);
  }
  const totalSpend = Object.values(categoryMap).reduce((s, v) => s + v, 0) || 1;
  const spendingByCategory = Object.entries(categoryMap).map(([category, amount]) => ({
    category,
    amount,
    percentage: Math.round((amount / totalSpend) * 100),
  }));

  res.json({
    totalBalance,
    monthlySpend,
    monthlyIncome,
    savingsTotal,
    recentTransactions: top10.map(t => ({
      ...t,
      amount: parseFloat(t.amount),
      recipientName: t.recipientName ?? null,
      recipientBank: t.recipientBank ?? null,
      recipientAccount: t.recipientAccount ?? null,
      senderName: t.senderName ?? null,
      category: t.category ?? null,
    })),
    spendingByCategory,
  });
});

router.get("/accounts/:id/statement", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { from, to } = req.query as { from?: string; to?: string };

  const [account] = await db.select().from(accountsTable)
    .where(and(eq(accountsTable.id, raw), eq(accountsTable.userId, req.userId!)));
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  const toDate = to ? new Date(to) : null;
  if (toDate) toDate.setDate(toDate.getDate() + 1);

  const txns = await db.select().from(transactionsTable)
    .where(and(
      eq(transactionsTable.accountId, raw),
      from ? gte(transactionsTable.createdAt, new Date(from)) : undefined,
      toDate ? lte(transactionsTable.createdAt, toDate) : undefined,
    ))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(500);

  res.json(txns.map(t => ({
    ...t,
    amount: parseFloat(t.amount),
    recipientName: t.recipientName ?? null,
    recipientBank: t.recipientBank ?? null,
    recipientAccount: t.recipientAccount ?? null,
    senderName: t.senderName ?? null,
    category: t.category ?? null,
  })));
});

router.post("/accounts/:id/deposit", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { amount } = req.body;

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    res.status(400).json({ error: "Invalid deposit amount" });
    return;
  }

  // Check if Paystack Gateway is online
  try {
    const [paystackFlag] = await db.select().from(featureFlagsTable)
      .where(eq(featureFlagsTable.key, "sandbox-paystack-online")).limit(1);
    const isPaystackOnline = paystackFlag ? paystackFlag.isEnabled : true;
    if (!isPaystackOnline) {
      res.status(503).json({ error: "Paystack Gateway Timeout: Simulation of service outage is active." });
      return;
    }
  } catch (err) {
    // Fallback
  }

  try {
    const txn = await db.transaction(async (tx) => {
      const [account] = await tx.select().from(accountsTable)
        .where(and(eq(accountsTable.id, raw), eq(accountsTable.userId, req.userId!)))
        .for("update");

      if (!account) {
        throw new Error("Account not found");
      }

      const currentBalance = parseFloat(account.balance);
      const newBalance = (currentBalance + Number(amount)).toFixed(2);

      await tx.update(accountsTable)
        .set({ balance: newBalance })
        .where(eq(accountsTable.id, raw));

      const [insertedTxn] = await tx.insert(transactionsTable).values({
        id: generateId(),
        accountId: raw,
        type: "credit",
        amount: Number(amount).toFixed(2),
        currency: account.currency,
        description: "Deposit via Paystack Card",
        status: "completed",
        reference: generateReference(),
        category: "Deposit",
        recipientName: null,
        recipientBank: null,
        recipientAccount: null,
        senderName: "Paystack Checkout",
      }).returning();

      await tx.insert(notificationsTable).values({
        id: generateId(),
        userId: req.userId!,
        title: "Account Funded",
        message: `₦${Number(amount).toFixed(2)} deposited successfully via Paystack Card. Ref: ${insertedTxn.reference}`,
        type: "credit",
      });

      return { account, txn: insertedTxn };
    });

    res.status(200).json({
      message: "Account funded successfully",
      balance: parseFloat(txn.account.balance) + Number(amount),
      transaction: txn.txn
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
