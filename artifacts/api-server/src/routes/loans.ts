import { Router, type IRouter } from "express";
import { db, loansTable, accountsTable, transactionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { ApplyLoanBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { generateId, generateReference } from "../lib/auth";

const router: IRouter = Router();

function serializeLoan(row: typeof loansTable.$inferSelect) {
  return {
    ...row,
    amount: parseFloat(row.amount),
    monthlyRate: parseFloat(row.monthlyRate),
    repaidAmount: parseFloat(row.repaidAmount),
    approvedAt: row.approvedAt ? row.approvedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/loans", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const rows = await db.select().from(loansTable)
    .where(eq(loansTable.userId, req.userId!));
  res.json(rows.map(serializeLoan));
});

router.post("/loans", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = ApplyLoanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { accountId, amount, purpose, durationMonths } = parsed.data;

  const [account] = await db.select().from(accountsTable)
    .where(and(eq(accountsTable.id, accountId), eq(accountsTable.userId, req.userId!)));

  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  const autoApprove = amount <= 50000;
  const now = new Date();

  const [loan] = await db.insert(loansTable).values({
    id: generateId(),
    userId: req.userId!,
    accountId,
    amount: amount.toFixed(2),
    purpose,
    status: autoApprove ? "approved" : "pending",
    monthlyRate: "2.50",
    durationMonths,
    repaidAmount: "0",
    approvedAt: autoApprove ? now : null,
  }).returning();

  if (autoApprove) {
    const newBalance = (parseFloat(account.balance) + amount).toFixed(2);
    await db.update(accountsTable).set({ balance: newBalance }).where(eq(accountsTable.id, accountId));

    await db.insert(transactionsTable).values({
      id: generateId(),
      accountId,
      type: "credit",
      amount: amount.toFixed(2),
      currency: account.currency,
      description: `NovaPay Loan – ${purpose}`,
      status: "completed",
      reference: generateReference(),
      category: "Loan",
      recipientName: null,
      recipientBank: null,
      recipientAccount: null,
      senderName: "NovaPay Credit",
    });
  }

  res.status(201).json(serializeLoan(loan));
});

export default router;
