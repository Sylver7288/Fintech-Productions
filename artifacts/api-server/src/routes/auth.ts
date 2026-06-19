import { Router, type IRouter } from "express";
import { db, usersTable, accountsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { hashPassword, verifyPassword, generateToken, generateId, generateAccountNumber } from "../lib/auth";
import { tokensStore } from "../lib/tokens";

const router: IRouter = Router();

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

  // Create default current account
  const accountId = generateId();
  await db.insert(accountsTable).values({
    id: accountId,
    userId: id,
    accountNumber: generateAccountNumber(),
    type: "current",
    balance: "50000", // Seed with NGN 50,000 for demo
    currency: "NGN",
    status: "active",
    bankName: "Kuda Bank",
  });

  const token = generateToken();
  tokensStore.set(token, id);

  const { passwordHash: _ph, ...safeUser } = user;
  res.status(201).json({
    token,
    user: {
      ...safeUser,
      avatarUrl: safeUser.avatarUrl ?? null,
      bvn: safeUser.bvn ?? null,
    },
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
    user: {
      ...safeUser,
      avatarUrl: safeUser.avatarUrl ?? null,
      bvn: safeUser.bvn ?? null,
    },
  });
});

export default router;
