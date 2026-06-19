import { Router, type IRouter } from "express";
import { db, transactionsTable, accountsTable } from "@workspace/db";
import { eq, and, desc, count } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/transactions", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { accountId, limit = "20", offset = "0", type } = req.query as Record<string, string>;
  const limitN = Math.min(parseInt(limit, 10) || 20, 100);
  const offsetN = parseInt(offset, 10) || 0;

  // Get user's accounts
  const userAccounts = await db.select({ id: accountsTable.id })
    .from(accountsTable)
    .where(eq(accountsTable.userId, req.userId!));
  const accountIds = userAccounts.map(a => a.id);

  if (accountIds.length === 0) {
    res.json({ transactions: [], total: 0, limit: limitN, offset: offsetN });
    return;
  }

  let allTxns: typeof transactionsTable.$inferSelect[] = [];

  if (accountId) {
    if (!accountIds.includes(accountId)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    allTxns = await db.select().from(transactionsTable)
      .where(eq(transactionsTable.accountId, accountId))
      .orderBy(desc(transactionsTable.createdAt));
  } else {
    for (const aid of accountIds) {
      const txns = await db.select().from(transactionsTable)
        .where(eq(transactionsTable.accountId, aid))
        .orderBy(desc(transactionsTable.createdAt));
      allTxns.push(...txns);
    }
    allTxns.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  if (type && type !== "all") {
    allTxns = allTxns.filter(t => t.type === type);
  }

  const total = allTxns.length;
  const page = allTxns.slice(offsetN, offsetN + limitN);

  res.json({
    transactions: page.map(t => ({
      ...t,
      amount: parseFloat(t.amount),
      recipientName: t.recipientName ?? null,
      recipientBank: t.recipientBank ?? null,
      recipientAccount: t.recipientAccount ?? null,
      senderName: t.senderName ?? null,
      category: t.category ?? null,
    })),
    total,
    limit: limitN,
    offset: offsetN,
  });
});

router.get("/transactions/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [txn] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, raw));
  if (!txn) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  // Verify ownership
  const [account] = await db.select().from(accountsTable)
    .where(and(eq(accountsTable.id, txn.accountId), eq(accountsTable.userId, req.userId!)));
  if (!account) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  res.json({
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
