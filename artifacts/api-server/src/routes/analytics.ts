import { Router, type IRouter } from "express";
import { db, accountsTable, transactionsTable } from "@workspace/db";
import { eq, gte, inArray } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/analytics", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const days = Math.min(parseInt(String(req.query["days"] ?? "30"), 10) || 30, 365);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const userAccounts = await db.select({ id: accountsTable.id })
    .from(accountsTable)
    .where(eq(accountsTable.userId, req.userId!));

  const accountIds = userAccounts.map(a => a.id);

  if (!accountIds.length) {
    res.json({ period: days, totalSpend: 0, totalIncome: 0, categories: [], monthlyTrend: [] });
    return;
  }

  const allTxns = await db.select().from(transactionsTable)
    .where(
      inArray(transactionsTable.accountId, accountIds)
    );

  const filtered = allTxns.filter(t => t.createdAt >= since);

  let totalSpend = 0;
  let totalIncome = 0;
  const categoryMap: Record<string, number> = {};
  const monthMap: Record<string, { spend: number; income: number }> = {};

  for (const txn of filtered) {
    const amount = parseFloat(txn.amount);
    const cat = txn.category ?? "Other";
    const month = txn.createdAt.toISOString().slice(0, 7);

    if (!monthMap[month]) monthMap[month] = { spend: 0, income: 0 };

    if (txn.type === "debit") {
      totalSpend += amount;
      categoryMap[cat] = (categoryMap[cat] ?? 0) + amount;
      monthMap[month].spend += amount;
    } else {
      totalIncome += amount;
      monthMap[month].income += amount;
    }
  }

  const categories = Object.entries(categoryMap)
    .map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
      percentage: totalSpend > 0 ? Math.round((amount / totalSpend) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const monthlyTrend = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month,
      spend: Math.round(v.spend * 100) / 100,
      income: Math.round(v.income * 100) / 100,
    }));

  res.json({
    period: days,
    totalSpend: Math.round(totalSpend * 100) / 100,
    totalIncome: Math.round(totalIncome * 100) / 100,
    categories,
    monthlyTrend,
  });
});

export default router;
