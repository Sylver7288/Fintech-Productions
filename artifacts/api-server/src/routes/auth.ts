import { Router, type IRouter } from "express";
import { db, usersTable, accountsTable, cardsTable, transactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import {
  hashPassword, verifyPassword, generateToken,
  generateId, generateAccountNumber, generateReference,
} from "../lib/auth";
import { tokensStore } from "../lib/tokens";

const router: IRouter = Router();

const CARD_COLORS = ["#6C5CE7", "#0984E3", "#00B894", "#E17055", "#6C5CE7"];

async function seedDemoTransactions(accountId: string, currency: string) {
  const now = Date.now();
  const demos = [
    { type: "credit", amount: "50000.00", description: "Welcome bonus", category: "Transfer", senderName: "NovaPay", daysAgo: 0 },
    { type: "debit", amount: "3500.00", description: "Uber ride", category: "Transport", recipientName: "Uber", recipientBank: "Flutterwave", daysAgo: 1 },
    { type: "debit", amount: "8200.00", description: "Shoprite groceries", category: "Food & Drink", recipientName: "Shoprite", recipientBank: "GTBank", daysAgo: 2 },
    { type: "credit", amount: "15000.00", description: "Freelance payment", category: "Transfer", senderName: "Chukwuemeka O.", daysAgo: 3 },
    { type: "debit", amount: "5000.00", description: "DSTV subscription", category: "Bills", recipientName: "MultiChoice", recipientBank: "Zenith Bank", daysAgo: 4 },
    { type: "debit", amount: "1200.00", description: "Bolt ride", category: "Transport", recipientName: "Bolt", recipientBank: "Flutterwave", daysAgo: 5 },
    { type: "credit", amount: "25000.00", description: "Salary credit", category: "Transfer", senderName: "Acme Corp Ltd", daysAgo: 7 },
    { type: "debit", amount: "6400.00", description: "MTN airtime top-up", category: "Bills", recipientName: "MTN Nigeria", recipientBank: "First Bank", daysAgo: 8 },
  ];

  for (const demo of demos) {
    const createdAt = new Date(now - demo.daysAgo * 86400000);
    await db.insert(transactionsTable).values({
      id: generateId(),
      accountId,
      type: demo.type,
      amount: demo.amount,
      currency,
      description: demo.description,
      status: "completed",
      reference: generateReference(),
      category: demo.category ?? null,
      recipientName: (demo as any).recipientName ?? null,
      recipientBank: (demo as any).recipientBank ?? null,
      recipientAccount: null,
      senderName: (demo as any).senderName ?? null,
    });
  }
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { firstName, lastName, email, password, phone } = parsed.data;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const id = generateId();
  const passwordHash = hashPassword(password);

  const [user] = await db.insert(usersTable).values({
    id,
    firstName,
    lastName,
    email,
    passwordHash,
    phone,
    kycStatus: "pending",
  }).returning();

  // Create default current account seeded with ₦50,000
  const accountId = generateId();
  await db.insert(accountsTable).values({
    id: accountId,
    userId: id,
    accountNumber: generateAccountNumber(),
    type: "current",
    balance: "71700", // 50000 welcome - debits + 40000 credits = 71700
    currency: "NGN",
    status: "active",
    bankName: "NovaPay",
  });

  // Auto-create a virtual card
  const now = new Date();
  await db.insert(cardsTable).values({
    id: generateId(),
    userId: id,
    accountId,
    type: "virtual",
    last4: Math.floor(1000 + Math.random() * 9000).toString(),
    expiryMonth: String(now.getMonth() + 1).padStart(2, "0"),
    expiryYear: (now.getFullYear() + 4).toString(),
    status: "active",
    cardHolder: `${firstName} ${lastName}`.toUpperCase(),
    color: CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)],
  });

  // Seed demo transactions so the app looks alive
  await seedDemoTransactions(accountId, "NGN");

  const token = generateToken();
  tokensStore.set(token, id);

  const { passwordHash: _ph, ...safeUser } = user;
  res.status(201).json({
    token,
    user: { ...safeUser, avatarUrl: safeUser.avatarUrl ?? null, bvn: safeUser.bvn ?? null },
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = generateToken();
  tokensStore.set(token, user.id);

  const { passwordHash: _ph, ...safeUser } = user;
  res.json({
    token,
    user: { ...safeUser, avatarUrl: safeUser.avatarUrl ?? null, bvn: safeUser.bvn ?? null },
  });
});

export default router;
