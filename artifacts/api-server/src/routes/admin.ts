import { Router, type IRouter } from "express";
import { readKeys, writeKeys } from "../lib/gateway-keys";
import { 
  db, 
  adminsTable, 
  usersTable, 
  accountsTable, 
  transactionsTable, 
  cardsTable, 
  featureFlagsTable,
  notificationsTable,
  bannersTable,
  auditLogsTable,
  feeRulesTable,
  reconciliationsTable,
  reconciliationLogsTable,
  supportSettingsTable
} from "@workspace/db";
import { eq, desc, sql, and, inArray } from "drizzle-orm";
import { verifyPassword, generateToken, generateId, hashPassword } from "../lib/auth";
import { adminTokensStore } from "../lib/tokens";
import { requireAdminAuth, type AdminAuthRequest } from "../middlewares/admin-auth";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const router: IRouter = Router();

// 1. Admin Login
router.post("/admin/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  try {
    const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.username, username)).limit(1);
    if (!admin || !verifyPassword(password, admin.passwordHash)) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    const token = generateToken(admin.id);
    adminTokensStore.set(token, admin.id);

    res.json({
      token,
      admin: {
        id: admin.id,
        username: admin.username
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Fetch Global Analytics
router.get("/admin/analytics", requireAdminAuth, async (req: AdminAuthRequest, res) => {
  try {
    // Counts
    const usersResult = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
    const totalUsers = Number(usersResult[0]?.count ?? 0);

    const cardsResult = await db.select({ count: sql<number>`count(*)` }).from(cardsTable).where(eq(cardsTable.status, "active"));
    const activeCards = Number(cardsResult[0]?.count ?? 0);

    // Inflows and Outflows
    const allTxns = await db.select().from(transactionsTable);
    let totalInflow = 0;
    let totalOutflow = 0;
    
    // Group transaction trends by date (YYYY-MM-DD)
    const dailyMap: Record<string, { date: string; inflow: number; outflow: number }> = {};

    for (const txn of allTxns) {
      const amount = parseFloat(txn.amount);
      const dateStr = txn.createdAt.toISOString().slice(0, 10);
      
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { date: dateStr, inflow: 0, outflow: 0 };
      }

      if (txn.type === "credit") {
        totalInflow += amount;
        dailyMap[dateStr].inflow += amount;
      } else {
        totalOutflow += amount;
        dailyMap[dateStr].outflow += amount;
      }
    }

    const trends = Object.values(dailyMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days of data

    res.json({
      totalUsers,
      activeCards,
      totalInflow: Math.round(totalInflow * 100) / 100,
      totalOutflow: Math.round(totalOutflow * 100) / 100,
      trends
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. List Users
router.get("/admin/users", requireAdminAuth, async (req: AdminAuthRequest, res) => {
  try {
    const allUsers = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
    
    // Enrich with their balances, card details, and recent transactions
    const enrichedUsers = await Promise.all(allUsers.map(async (user) => {
      const userAccounts = await db.select().from(accountsTable).where(eq(accountsTable.userId, user.id));
      const totalBalance = userAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
      const userCards = await db.select().from(cardsTable).where(eq(cardsTable.userId, user.id));

      const accountIds = userAccounts.map(a => a.id);
      const userTxns = accountIds.length > 0
        ? await db.select().from(transactionsTable)
            .where(inArray(transactionsTable.accountId, accountIds))
            .orderBy(desc(transactionsTable.createdAt))
            .limit(20)
        : [];

      return {
        ...user,
        accounts: userAccounts,
        cards: userCards,
        transactions: userTxns,
        totalBalance: Math.round(totalBalance * 100) / 100
      };
    }));

    res.json(enrichedUsers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. KYC Status Actions
router.post("/admin/users/:id/kyc", requireAdminAuth, async (req: AdminAuthRequest, res) => {
  const id = String(req.params.id);
  const { status } = req.body; // 'approved' or 'rejected' or 'pending'
  
  if (!status || !["approved", "rejected", "pending"].includes(status)) {
    res.status(400).json({ error: "Invalid status value" });
    return;
  }

  try {
    await db.update(usersTable)
      .set({ kycStatus: status, updatedAt: new Date() })
      .where(eq(usersTable.id, id));

    res.json({ success: true, message: `KYC status updated to ${status}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Toggle Freeze Cards
router.post("/admin/cards/:id/toggle-freeze", requireAdminAuth, async (req: AdminAuthRequest, res) => {
  const id = String(req.params.id);

  try {
    const [card] = await db.select().from(cardsTable).where(eq(cardsTable.id, id)).limit(1);
    if (!card) {
      res.status(404).json({ error: "Card not found" });
      return;
    }

    const newStatus = card.status === "active" ? "frozen" : "active";
    await db.update(cardsTable)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(cardsTable.id, id));

    res.json({ success: true, status: newStatus });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Get Feature Flags
router.get("/admin/flags", requireAdminAuth, async (req: AdminAuthRequest, res) => {
  try {
    const flags = await db.select().from(featureFlagsTable);
    res.json(flags);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Toggle Feature Flags
router.post("/admin/flags/:id/toggle", requireAdminAuth, async (req: AdminAuthRequest, res) => {
  const id = String(req.params.id);
  const { isEnabled } = req.body;

  if (typeof isEnabled !== "boolean") {
    res.status(400).json({ error: "isEnabled must be a boolean" });
    return;
  }

  try {
    await db.update(featureFlagsTable)
      .set({ isEnabled, updatedAt: new Date() })
      .where(eq(featureFlagsTable.id, id));

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Public Feature Flags endpoint (for mobile app client checks)
router.get("/flags", async (req, res) => {
  try {
    const flags = await db.select().from(featureFlagsTable);
    res.json(flags);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Broadcast Custom Alert to All Users
router.post("/admin/broadcast", requireAdminAuth, async (req: AdminAuthRequest, res) => {
  const { title, message } = req.body;
  if (!title || !message) {
    res.status(400).json({ error: "Title and message are required" });
    return;
  }

  try {
    const allUsers = await db.select({ id: usersTable.id }).from(usersTable);
    
    if (allUsers.length > 0) {
      await db.insert(notificationsTable).values(
        allUsers.map((user) => ({
          id: generateId(),
          userId: user.id,
          title,
          message,
          type: "system",
        }))
      );
    }

    res.json({ success: true, message: `System alert broadcasted to ${allUsers.length} users successfully.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});



// 10. Get Gateway API Credentials
router.get("/admin/gateway-keys", requireAdminAuth, (req: AdminAuthRequest, res) => {
  const keys = readKeys();
  const maskKey = (key: string) => {
    if (!key) return "";
    if (key.length <= 8) return "••••••••";
    return key.slice(0, 8) + "••••••••" + key.slice(-4);
  };

  res.json({
    paystackPublicKey: keys.paystackPublicKey || "",
    paystackSecretKey: maskKey(keys.paystackSecretKey || ""),
    flutterwavePublicKey: keys.flutterwavePublicKey || "",
    flutterwaveSecretKey: maskKey(keys.flutterwaveSecretKey || ""),
    stripeSecretKey: maskKey(keys.stripeSecretKey || ""),
    smileIdApiKey: maskKey(keys.smileIdApiKey || ""),
    sudoApiKey: maskKey(keys.sudoApiKey || ""),
    bridgecardApiKey: maskKey(keys.bridgecardApiKey || ""),
  });
});

// 11. Save Gateway API Credentials
router.post("/admin/gateway-keys", requireAdminAuth, (req: AdminAuthRequest, res) => {
  const newKeys = req.body;
  const currentKeys = readKeys();

  const updateKey = (newVal: string, oldVal: string) => {
    if (!newVal) return "";
    if (newVal.includes("••••")) return oldVal;
    return newVal;
  };

  const updated = {
    paystackPublicKey: newKeys.paystackPublicKey || "",
    paystackSecretKey: updateKey(newKeys.paystackSecretKey || "", currentKeys.paystackSecretKey || ""),
    flutterwavePublicKey: newKeys.flutterwavePublicKey || "",
    flutterwaveSecretKey: updateKey(newKeys.flutterwaveSecretKey || "", currentKeys.flutterwaveSecretKey || ""),
    stripeSecretKey: updateKey(newKeys.stripeSecretKey || "", currentKeys.stripeSecretKey || ""),
    smileIdApiKey: updateKey(newKeys.smileIdApiKey || "", currentKeys.smileIdApiKey || ""),
    sudoApiKey: updateKey(newKeys.sudoApiKey || "", currentKeys.sudoApiKey || ""),
    bridgecardApiKey: updateKey(newKeys.bridgecardApiKey || "", currentKeys.bridgecardApiKey || ""),
  };

  const success = writeKeys(updated);
  if (success) {
    res.json({ success: true, message: "Gateway API credentials updated successfully." });
  } else {
    res.status(500).json({ error: "Failed to save gateway configuration credentials." });
  }
});

// 12. List Banners
router.get("/admin/banners", requireAdminAuth, async (req: AdminAuthRequest, res) => {
  try {
    const banners = await db.select().from(bannersTable).orderBy(desc(bannersTable.createdAt));
    res.json(banners);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 13. Create Banner
router.post("/admin/banners", requireAdminAuth, async (req: AdminAuthRequest, res) => {
  const { title, description, imageUrl, linkUrl } = req.body;
  if (!title) {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  try {
    const newBanner = {
      id: generateId(),
      title,
      description: description || null,
      imageUrl: imageUrl || null,
      linkUrl: linkUrl || null,
      isActive: true,
    };
    await db.insert(bannersTable).values(newBanner);
    res.status(201).json(newBanner);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 14. Update Banner
router.patch("/admin/banners/:id", requireAdminAuth, async (req: AdminAuthRequest, res) => {
  const id = String(req.params.id);
  const { title, description, imageUrl, linkUrl, isActive } = req.body;

  try {
    const [banner] = await db.select().from(bannersTable).where(eq(bannersTable.id, id)).limit(1);
    if (!banner) {
      res.status(404).json({ error: "Banner not found" });
      return;
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (linkUrl !== undefined) updateData.linkUrl = linkUrl;
    if (isActive !== undefined) updateData.isActive = isActive;

    await db.update(bannersTable).set(updateData).where(eq(bannersTable.id, id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 15. Delete Banner
router.delete("/admin/banners/:id", requireAdminAuth, async (req: AdminAuthRequest, res) => {
  const id = String(req.params.id);

  try {
    const [banner] = await db.select().from(bannersTable).where(eq(bannersTable.id, id)).limit(1);
    if (!banner) {
      res.status(404).json({ error: "Banner not found" });
      return;
    }

    await db.delete(bannersTable).where(eq(bannersTable.id, id));
    res.json({ success: true, message: "Banner deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 16. List Fee Rules
router.get("/admin/fee-rules", requireAdminAuth, async (req: AdminAuthRequest, res) => {
  try {
    const rules = await db.select().from(feeRulesTable).orderBy(feeRulesTable.transactionType);
    res.json(rules);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 17. Create / Update Fee Rule
router.post("/admin/fee-rules", requireAdminAuth, async (req: AdminAuthRequest, res) => {
  const { id, transactionType, feeType, value, minAmount, maxAmount, isActive } = req.body;
  if (!transactionType || !feeType || value === undefined) {
    res.status(400).json({ error: "transactionType, feeType, and value are required" });
    return;
  }

  try {
    const ruleId = id || generateId();
    const existing = id ? await db.select().from(feeRulesTable).where(eq(feeRulesTable.id, id)).limit(1) : [];

    const ruleData = {
      id: ruleId,
      transactionType,
      feeType,
      value: String(value),
      minAmount: String(minAmount || "0.00"),
      maxAmount: maxAmount ? String(maxAmount) : null,
      isActive: isActive !== false,
    };

    if (existing.length > 0) {
      await db.update(feeRulesTable).set(ruleData).where(eq(feeRulesTable.id, id));
    } else {
      await db.insert(feeRulesTable).values(ruleData);
    }

    // Write to audit log
    await db.insert(auditLogsTable).values({
      id: generateId(),
      adminId: req.adminId!,
      action: existing.length > 0 ? "fee_rule_update" : "fee_rule_create",
      targetType: "fee_rule",
      targetId: ruleId,
      ipAddress: req.ip,
      details: JSON.stringify(ruleData),
    });

    res.json({ success: true, rule: ruleData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 18. Delete Fee Rule
router.delete("/admin/fee-rules/:id", requireAdminAuth, async (req: AdminAuthRequest, res) => {
  const id = String(req.params.id);
  try {
    const [existing] = await db.select().from(feeRulesTable).where(eq(feeRulesTable.id, id)).limit(1);
    if (!existing) {
      res.status(404).json({ error: "Fee rule not found" });
      return;
    }

    await db.delete(feeRulesTable).where(eq(feeRulesTable.id, id));

    // Audit log
    await db.insert(auditLogsTable).values({
      id: generateId(),
      adminId: req.adminId!,
      action: "fee_rule_delete",
      targetType: "fee_rule",
      targetId: id,
      ipAddress: req.ip,
      details: JSON.stringify(existing),
    });

    res.json({ success: true, message: "Fee rule deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 19. Reverse Transaction
router.post("/admin/transactions/:id/reverse", requireAdminAuth, async (req: AdminAuthRequest, res): Promise<void> => {
  const id = String(req.params.id);
  try {
    const [txn] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, id)).limit(1);
    if (!txn) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }

    if (txn.isReversed) {
      res.status(400).json({ error: "Transaction is already reversed" });
      return;
    }

    if (txn.type !== "debit") {
      res.status(400).json({ error: "Only debit transactions can be reversed" });
      return;
    }

    const amount = parseFloat(txn.amount);
    const fee = parseFloat(txn.fee);
    const totalRefund = amount + fee;

    // Perform reversal inside transaction
    await db.transaction(async (tx) => {
      // 1. Credit sender's account back
      const [account] = await tx.select().from(accountsTable)
        .where(eq(accountsTable.id, txn.accountId))
        .for("update");

      if (!account) {
        throw new Error("Sender account not found during reversal");
      }

      const newBalance = (parseFloat(account.balance) + totalRefund).toFixed(2);
      await tx.update(accountsTable)
        .set({ balance: newBalance })
        .where(eq(accountsTable.id, txn.accountId));

      // 2. Mark original transaction as reversed
      await tx.update(transactionsTable)
        .set({
          isReversed: true,
          reversedAt: new Date(),
          reversedByAdminId: req.adminId!
        })
        .where(eq(transactionsTable.id, id));

      // 3. Create reversal transaction credit log
      const reversalTxnId = generateId();
      await tx.insert(transactionsTable).values({
        id: reversalTxnId,
        accountId: txn.accountId,
        type: "credit",
        amount: totalRefund.toFixed(2),
        fee: "0.00",
        currency: txn.currency,
        description: `Reversal of transfer Ref: ${txn.reference}`,
        status: "completed",
        reference: `REV${Date.now()}`,
        category: "Reversal",
        recipientName: null,
        recipientBank: null,
        recipientAccount: null,
        senderName: "System Administrator",
        isReversed: false,
      });

      // 4. Send notification
      await tx.insert(notificationsTable).values({
        id: generateId(),
        userId: account.userId,
        title: "Transaction Reversed",
        message: `₦${totalRefund.toFixed(2)} refunded for reversed transfer Ref: ${txn.reference}`,
        type: "credit",
      });

      // 5. Add audit log
      await tx.insert(auditLogsTable).values({
        id: generateId(),
        adminId: req.adminId!,
        action: "transaction_reversal",
        targetType: "transaction",
        targetId: id,
        ipAddress: req.ip,
        details: JSON.stringify({
          originalTransaction: txn,
          reversalTransactionId: reversalTxnId,
          refundedAmount: totalRefund,
        }),
      });
    });

    res.json({ success: true, message: "Transaction reversed successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 20. List Reconciliation Runs
router.get("/admin/reconciliation", requireAdminAuth, async (req: AdminAuthRequest, res) => {
  try {
    const runs = await db.select().from(reconciliationsTable).orderBy(desc(reconciliationsTable.createdAt));
    res.json(runs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 21. Get Reconciliation Details
router.get("/admin/reconciliation/:id", requireAdminAuth, async (req: AdminAuthRequest, res) => {
  const id = String(req.params.id);
  try {
    const [run] = await db.select().from(reconciliationsTable).where(eq(reconciliationsTable.id, id)).limit(1);
    if (!run) {
      res.status(404).json({ error: "Reconciliation run not found" });
      return;
    }

    const logs = await db.select().from(reconciliationLogsTable)
      .where(eq(reconciliationLogsTable.reconciliationId, id))
      .orderBy(reconciliationLogsTable.createdAt);

    res.json({ run, logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 22. Upload Settlement CSV & Reconcile
router.post("/admin/reconciliation/upload", requireAdminAuth, async (req: AdminAuthRequest, res): Promise<void> => {
  const { fileName, csvData } = req.body;
  if (!fileName || !csvData) {
    res.status(400).json({ error: "fileName and csvData are required" });
    return;
  }

  try {
    const lines = csvData.split(/\r?\n/).filter((l: string) => l.trim().length > 0);
    if (lines.length <= 1) {
      res.status(400).json({ error: "Reconciliation CSV must contain headers and at least one data record" });
      return;
    }

    const headers = lines[0].split(",").map((h: string) => h.trim().toLowerCase());
    const refIdx = headers.indexOf("reference");
    const amtIdx = headers.indexOf("amount");
    const statusIdx = headers.indexOf("status");

    if (refIdx === -1 || amtIdx === -1) {
      res.status(400).json({ error: "CSV must contain at least 'Reference' and 'Amount' headers" });
      return;
    }

    const records: { reference: string; amount: number; status: string }[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",").map((p: string) => p.trim());
      if (parts.length < Math.max(refIdx, amtIdx) + 1) continue;

      const reference = parts[refIdx];
      const amount = parseFloat(parts[amtIdx]);
      const status = statusIdx !== -1 ? parts[statusIdx].toLowerCase() : "completed";

      if (reference && !isNaN(amount)) {
        records.push({ reference, amount, status });
      }
    }

    const reconciliationId = generateId();
    let matchedCount = 0;
    let unmatchedCount = 0;
    const logInserts: any[] = [];
    const matchedRefs = new Set<string>();

    const internalTxns = await db.select().from(transactionsTable);
    const internalTxnMap = new Map(internalTxns.map(t => [t.reference, t]));

    for (const record of records) {
      const match = internalTxnMap.get(record.reference);
      matchedRefs.add(record.reference);

      if (!match) {
        logInserts.push({
          id: generateId(),
          reconciliationId,
          transactionReference: record.reference,
          amountInternal: "0.00",
          amountNibss: record.amount.toFixed(2),
          statusInternal: "N/A",
          statusNibss: record.status,
          comparisonResult: "missing_in_internal",
        });
        unmatchedCount++;
      } else {
        const intAmount = parseFloat(match.amount);
        const amountsMatch = Math.abs(intAmount - record.amount) < 0.01;
        const statusMatch = match.status === record.status;

        if (amountsMatch && statusMatch) {
          logInserts.push({
            id: generateId(),
            reconciliationId,
            transactionReference: record.reference,
            amountInternal: match.amount,
            amountNibss: record.amount.toFixed(2),
            statusInternal: match.status,
            statusNibss: record.status,
            comparisonResult: "matched",
          });
          matchedCount++;
        } else if (!amountsMatch) {
          logInserts.push({
            id: generateId(),
            reconciliationId,
            transactionReference: record.reference,
            amountInternal: match.amount,
            amountNibss: record.amount.toFixed(2),
            statusInternal: match.status,
            statusNibss: record.status,
            comparisonResult: "amount_mismatch",
          });
          unmatchedCount++;
        } else {
          logInserts.push({
            id: generateId(),
            reconciliationId,
            transactionReference: record.reference,
            amountInternal: match.amount,
            amountNibss: record.amount.toFixed(2),
            statusInternal: match.status,
            statusNibss: record.status,
            comparisonResult: "status_mismatch",
          });
          unmatchedCount++;
        }
      }
    }

    for (const [ref, match] of internalTxnMap.entries()) {
      if (!matchedRefs.has(ref) && (match.category === "Transfer" || match.category === "Deposit")) {
        logInserts.push({
          id: generateId(),
          reconciliationId,
          transactionReference: ref,
          amountInternal: match.amount,
          amountNibss: "0.00",
          statusInternal: match.status,
          statusNibss: "N/A",
          comparisonResult: "missing_in_nibss",
        });
        unmatchedCount++;
      }
    }

    const status = unmatchedCount === 0 ? "balanced" : "discrepancies";
    await db.insert(reconciliationsTable).values({
      id: reconciliationId,
      reportDate: new Date(),
      fileName,
      totalTransactions: records.length,
      matchedCount,
      unmatchedCount,
      status,
    });

    if (logInserts.length > 0) {
      for (let i = 0; i < logInserts.length; i += 100) {
        await db.insert(reconciliationLogsTable).values(logInserts.slice(i, i + 100));
      }
    }

    await db.insert(auditLogsTable).values({
      id: generateId(),
      adminId: req.adminId!,
      action: "reconciliation_run",
      targetType: "reconciliation",
      targetId: reconciliationId,
      ipAddress: req.ip,
      details: JSON.stringify({
        fileName,
        totalParsed: records.length,
        matched: matchedCount,
        unmatched: unmatchedCount,
      }),
    });

    const [savedRun] = await db.select().from(reconciliationsTable).where(eq(reconciliationsTable.id, reconciliationId)).limit(1);
    res.json({ success: true, run: savedRun, logs: logInserts.slice(0, 100) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 23. Retrieve Admin Audit Logs
router.get("/admin/audit-logs", requireAdminAuth, async (req: AdminAuthRequest, res) => {
  try {
    const logs = await db.select().from(auditLogsTable).orderBy(desc(auditLogsTable.createdAt)).limit(200);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 24. Retrieve Support Settings
router.get("/admin/support-settings", requireAdminAuth, async (req: AdminAuthRequest, res) => {
  try {
    const [settings] = await db.select().from(supportSettingsTable).where(eq(supportSettingsTable.id, "global")).limit(1);
    res.json(settings || { email: "support@novamoni.ng", whatsapp: "https://wa.me/2348000000000", liveChatUrl: "https://example.com/live-chat" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 25. Update Support Settings
router.post("/admin/support-settings", requireAdminAuth, async (req: AdminAuthRequest, res) => {
  const { email, whatsapp, liveChatUrl } = req.body;
  if (!email || !whatsapp || !liveChatUrl) {
    res.status(400).json({ error: "Email, WhatsApp, and Live Chat URL are required" });
    return;
  }

  try {
    const [existing] = await db.select().from(supportSettingsTable).where(eq(supportSettingsTable.id, "global")).limit(1);
    
    const settingsData = {
      id: "global",
      email,
      whatsapp,
      liveChatUrl,
      updatedAt: new Date()
    };

    if (existing) {
      await db.update(supportSettingsTable).set(settingsData).where(eq(supportSettingsTable.id, "global"));
    } else {
      await db.insert(supportSettingsTable).values(settingsData);
    }

    // Write to audit log
    await db.insert(auditLogsTable).values({
      id: generateId(),
      adminId: req.adminId!,
      action: "support_settings_update",
      targetType: "support_settings",
      targetId: "global",
      ipAddress: req.ip,
      details: JSON.stringify(settingsData),
    });

    res.json({ success: true, settings: settingsData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 15. Staff Management Routes (Superadmin Only for mutate operations)

// A. Get all staff/admins
router.get("/admin/staffs", requireAdminAuth, async (req: AdminAuthRequest, res) => {
  try {
    const list = await db.select({
      id: adminsTable.id,
      username: adminsTable.username,
      role: adminsTable.role,
      createdAt: adminsTable.createdAt,
      updatedAt: adminsTable.updatedAt,
    }).from(adminsTable).orderBy(desc(adminsTable.createdAt));
    
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// B. Create staff
router.post("/admin/staffs", requireAdminAuth, async (req: AdminAuthRequest, res) => {
  try {
    if (req.adminRole !== "superadmin") {
      res.status(403).json({ error: "Forbidden: Only superadmins can create staff." });
      return;
    }

    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      res.status(400).json({ error: "Username, password and role are required." });
      return;
    }

    const [existing] = await db.select().from(adminsTable).where(eq(adminsTable.username, username));
    if (existing) {
      res.status(409).json({ error: "Username already exists." });
      return;
    }

    const passwordHash = hashPassword(password);
    const newStaffId = generateId();

    const [inserted] = await db.insert(adminsTable).values({
      id: newStaffId,
      username,
      passwordHash,
      role,
    }).returning();

    // Log action to audit log
    await db.insert(auditLogsTable).values({
      id: generateId(),
      adminId: req.adminId!,
      action: "create_staff",
      targetType: "admin",
      targetId: newStaffId,
      ipAddress: req.ip,
      details: `Created staff member ${username} with role ${role}`,
    });

    res.status(201).json({
      success: true,
      staff: {
        id: inserted.id,
        username: inserted.username,
        role: inserted.role,
        createdAt: inserted.createdAt,
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// C. Update staff
router.put("/admin/staffs/:id", requireAdminAuth, async (req: AdminAuthRequest, res) => {
  try {
    if (req.adminRole !== "superadmin") {
      res.status(403).json({ error: "Forbidden: Only superadmins can modify staff." });
      return;
    }

    const { id } = req.params;
    const { password, role } = req.body;

    const [existing] = await db.select().from(adminsTable).where(eq(adminsTable.id, id as string));
    if (!existing) {
      res.status(404).json({ error: "Staff member not found." });
      return;
    }

    const updateData: any = {};
    if (role) {
      updateData.role = role;
    }
    if (password) {
      updateData.passwordHash = hashPassword(password);
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: "No fields to update." });
      return;
    }

    const [updated] = await db.update(adminsTable)
      .set(updateData)
      .where(eq(adminsTable.id, id as string))
      .returning();

    // Log action to audit log
    await db.insert(auditLogsTable).values({
      id: generateId(),
      adminId: req.adminId as string,
      action: "update_staff",
      targetType: "admin",
      targetId: id as string,
      ipAddress: req.ip,
      details: `Updated staff member ${existing.username}. Role updated: ${!!role}, Password updated: ${!!password}`,
    });

    res.json({
      success: true,
      staff: {
        id: updated.id,
        username: updated.username,
        role: updated.role,
        updatedAt: updated.updatedAt,
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// D. Delete staff
router.delete("/admin/staffs/:id", requireAdminAuth, async (req: AdminAuthRequest, res) => {
  try {
    if (req.adminRole !== "superadmin") {
      res.status(403).json({ error: "Forbidden: Only superadmins can delete staff." });
      return;
    }

    const { id } = req.params;
    if (id === req.adminId) {
      res.status(400).json({ error: "You cannot delete your own administrative account." });
      return;
    }

    const [existing] = await db.select().from(adminsTable).where(eq(adminsTable.id, id as string));
    if (!existing) {
      res.status(404).json({ error: "Staff member not found." });
      return;
    }

    await db.delete(adminsTable).where(eq(adminsTable.id, id as string));

    // Log action to audit log
    await db.insert(auditLogsTable).values({
      id: generateId(),
      adminId: req.adminId as string,
      action: "delete_staff",
      targetType: "admin",
      targetId: id as string,
      ipAddress: req.ip,
      details: `Deleted staff member ${existing.username}`,
    });

    res.json({ success: true, message: `Staff member ${existing.username} deleted successfully.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
