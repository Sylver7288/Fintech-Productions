import { Router, type IRouter } from "express";
import { db, loansTable, accountsTable, transactionsTable, notificationsTable } from "@workspace/db";
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

  try {
    const loan = await db.transaction(async (tx) => {
      // 1. Fetch account with row-level lock (ACID lock)
      const [account] = await tx.select().from(accountsTable)
        .where(and(eq(accountsTable.id, accountId), eq(accountsTable.userId, req.userId!)))
        .for("update");

      if (!account) {
        throw new Error("Account not found");
      }

      const autoApprove = amount <= 50000;
      const now = new Date();

      const [insertedLoan] = await tx.insert(loansTable).values({
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
        // 2. Adjust balance and write credit transactions
        const newBalance = (parseFloat(account.balance) + amount).toFixed(2);
        await tx.update(accountsTable)
          .set({ balance: newBalance })
          .where(eq(accountsTable.id, accountId));

        await tx.insert(transactionsTable).values({
          id: generateId(),
          accountId,
          type: "credit",
          amount: amount.toFixed(2),
          currency: account.currency,
          description: `Novamoni Loan – ${purpose}`,
          status: "completed",
          reference: generateReference(),
          category: "Loan",
          recipientName: null,
          recipientBank: null,
          recipientAccount: null,
          senderName: "Novamoni Credit",
        });

        // 3. Log credit notification
        await tx.insert(notificationsTable).values({
          id: generateId(),
          userId: req.userId!,
          title: "Loan Approved & Credited",
          message: `Your loan of ₦${amount.toFixed(2)} for "${purpose}" has been approved and credited to your account.`,
          type: "credit",
        });
      } else {
        // 3. Log pending loan notification
        await tx.insert(notificationsTable).values({
          id: generateId(),
          userId: req.userId!,
          title: "Loan Under Review",
          message: `Your loan request of ₦${amount.toFixed(2)} for "${purpose}" has been submitted and is under administrative review.`,
          type: "system",
        });
      }

      return insertedLoan;
    });

    res.status(201).json(serializeLoan(loan));
  } catch (error: any) {
    if (error.message === "Account not found") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

export default router;
