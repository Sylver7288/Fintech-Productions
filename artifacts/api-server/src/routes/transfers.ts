import { Router, type IRouter } from "express";
import { db, accountsTable, transactionsTable, notificationsTable, feeRulesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateTransferBody, VerifyNameBody, EasyPayWebhookBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { generateId, generateReference } from "../lib/auth";
import { executeEasyPayTransfer, nameEnquiry, queryTransferStatus } from "../lib/nibss-easypay";

const router: IRouter = Router();

router.post("/transfers", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateTransferBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { fromAccountId, amount, recipientName, recipientBank, recipientAccount, description } = parsed.data;

  try {
    // 1. Fetch active transfer fee rules
    const rules = await db.select().from(feeRulesTable)
      .where(and(eq(feeRulesTable.transactionType, "transfer"), eq(feeRulesTable.isActive, true)));

    let fee = 0;
    const matchingRule = rules.find(r => {
      const min = parseFloat(r.minAmount);
      const max = r.maxAmount ? parseFloat(r.maxAmount) : Infinity;
      return amount >= min && amount <= max;
    });

    if (matchingRule) {
      if (matchingRule.feeType === "fixed") {
        fee = parseFloat(matchingRule.value);
      } else if (matchingRule.feeType === "percentage") {
        fee = amount * parseFloat(matchingRule.value);
      }
    }

    const totalDeduction = amount + fee;
    const txnId = generateId();
    const txnRef = generateReference();

    // 2. Local ledger updates first (Deduct balance, insert as pending)
    await db.transaction(async (tx) => {
      const [account] = await tx.select().from(accountsTable)
        .where(and(eq(accountsTable.id, fromAccountId), eq(accountsTable.userId, req.userId!)))
        .for("update");

      if (!account) {
        throw new Error("Account not found");
      }

      if (account.status !== "active") {
        throw new Error("Account is not active");
      }

      const currentBalance = parseFloat(account.balance);
      if (currentBalance < totalDeduction) {
        throw new Error("Insufficient funds (including transfer fee)");
      }

      const newBalance = (currentBalance - totalDeduction).toFixed(2);
      await tx.update(accountsTable)
        .set({ balance: newBalance })
        .where(eq(accountsTable.id, fromAccountId));

      await tx.insert(transactionsTable).values({
        id: txnId,
        accountId: fromAccountId,
        type: "debit",
        amount: amount.toFixed(2),
        fee: fee.toFixed(2),
        currency: account.currency,
        description: description || `Transfer of ₦${amount.toFixed(2)} to ${recipientName}`,
        status: "pending",
        reference: txnRef,
        category: "Transfer",
        recipientName,
        recipientBank,
        recipientAccount,
        senderName: null,
        isReversed: false,
      });
    });

    // 3. Trigger external NIBSS EasyPay transfer call
    const result = await executeEasyPayTransfer({
      amount,
      recipientAccount,
      recipientBank,
      recipientName,
      reference: txnRef,
      description: description || `Transfer to ${recipientName}`,
    });

    if (result.success) {
      // 4. Update transaction status to completed on success
      await db.update(transactionsTable)
        .set({ status: "completed" })
        .where(eq(transactionsTable.id, txnId));

      await db.insert(notificationsTable).values({
        id: generateId(),
        userId: req.userId!,
        title: "Transfer Sent",
        message: `₦${amount.toFixed(2)} sent to ${recipientName} (${recipientBank}). Ref: ${txnRef}`,
        type: "debit",
      });

      const [completedTxn] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, txnId)).limit(1);
      
      res.status(201).json({
        ...completedTxn,
        amount: parseFloat(completedTxn.amount),
        fee: parseFloat(completedTxn.fee),
        recipientName: completedTxn.recipientName ?? null,
        recipientBank: completedTxn.recipientBank ?? null,
        recipientAccount: completedTxn.recipientAccount ?? null,
        senderName: completedTxn.senderName ?? null,
        category: completedTxn.category ?? null,
      });
    } else {
      // 5. Transfer failed: Rollback ledger and mark as failed
      await db.transaction(async (tx) => {
        const [account] = await tx.select().from(accountsTable)
          .where(eq(accountsTable.id, fromAccountId))
          .for("update");

        if (account) {
          const refundedBalance = (parseFloat(account.balance) + totalDeduction).toFixed(2);
          await tx.update(accountsTable)
            .set({ balance: refundedBalance })
            .where(eq(accountsTable.id, fromAccountId));
        }

        await tx.update(transactionsTable)
          .set({ 
            status: "failed", 
            description: `[Failed] ${description || `Transfer to ${recipientName}`} - Reason: ${result.error}`
          })
          .where(eq(transactionsTable.id, txnId));

        await tx.insert(notificationsTable).values({
          id: generateId(),
          userId: req.userId!,
          title: "Transfer Failed (Refunded)",
          message: `₦${amount.toFixed(2)} transfer failed. Balance and fees refunded. Ref: ${txnRef}`,
          type: "system",
        });
      });

      res.status(400).json({ error: result.error || "Transfer failed" });
    }
  } catch (error: any) {
    if (error.message === "Account not found") {
      res.status(404).json({ error: error.message });
    } else if (error.message === "Account is not active" || error.message.includes("Insufficient funds")) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// 2. Name Enquiry Endpoint
router.post("/transfers/name-enquiry", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = VerifyNameBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { accountNumber, bankCode } = parsed.data;

  try {
    const result = await nameEnquiry(accountNumber, bankCode);
    if (!result.success) {
      res.status(400).json({ error: result.error || "Name Enquiry failed" });
      return;
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Status Query Endpoint
router.get("/transfers/:reference/status", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const reference = req.params.reference as string;
  if (!reference) {
    res.status(400).json({ error: "Reference is required" });
    return;
  }

  try {
    const result = await queryTransferStatus(reference);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Webhook Callback Endpoint
router.post("/transfers/webhook/easypay", async (req, res): Promise<void> => {
  const parsed = EasyPayWebhookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { reference, status } = parsed.data;

  try {
    // Fetch transaction by reference
    const [txn] = await db.select().from(transactionsTable)
      .where(eq(transactionsTable.reference, reference))
      .limit(1);

    if (!txn) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }

    // Only process if currently pending
    if (txn.status !== "pending") {
      res.json({ success: true, message: `Transaction already in status ${txn.status}` });
      return;
    }

    if (status === "completed") {
      await db.update(transactionsTable)
        .set({ status: "completed" })
        .where(eq(transactionsTable.id, txn.id));

      const [account] = await db.select().from(accountsTable).where(eq(accountsTable.id, txn.accountId)).limit(1);
      if (account) {
        await db.insert(notificationsTable).values({
          id: generateId(),
          userId: account.userId,
          title: "Transfer Sent",
          message: `₦${parseFloat(txn.amount).toFixed(2)} sent to ${txn.recipientName} (${txn.recipientBank}). Ref: ${reference}`,
          type: "debit",
        });
      }

      res.json({ success: true, message: "Transaction completed successfully" });
    } else if (status === "failed") {
      const amount = parseFloat(txn.amount);
      const fee = parseFloat(txn.fee);
      const totalDeduction = amount + fee;

      await db.transaction(async (tx) => {
        const [account] = await tx.select().from(accountsTable)
          .where(eq(accountsTable.id, txn.accountId))
          .for("update");

        if (account) {
          const refundedBalance = (parseFloat(account.balance) + totalDeduction).toFixed(2);
          await tx.update(accountsTable)
            .set({ balance: refundedBalance })
            .where(eq(accountsTable.id, txn.accountId));

          await tx.insert(notificationsTable).values({
            id: generateId(),
            userId: account.userId,
            title: "Transfer Failed (Refunded)",
            message: `₦${amount.toFixed(2)} transfer failed. Balance and fees refunded. Ref: ${reference}`,
            type: "system",
          });
        }

        await tx.update(transactionsTable)
          .set({ 
            status: "failed", 
            description: `[Failed] ${txn.description} - Reason: NIBSS status callback indicated failure`
          })
          .where(eq(transactionsTable.id, txn.id));
      });

      res.json({ success: true, message: "Transaction rolled back and set to failed" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
