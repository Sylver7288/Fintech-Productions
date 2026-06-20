import { Router, type IRouter } from "express";
import { db, scheduledTransfersTable } from "@workspace/db";
import { eq, and, ne } from "drizzle-orm";
import { CreateScheduledTransferBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { generateId } from "../lib/auth";

const router: IRouter = Router();

router.get("/scheduled-transfers", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const rows = await db.select().from(scheduledTransfersTable)
    .where(eq(scheduledTransfersTable.userId, req.userId!));

  res.json(rows.map(r => ({
    ...r,
    amount: parseFloat(r.amount),
    nextRunAt: r.nextRunAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
  })));
});

router.post("/scheduled-transfers", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateScheduledTransferBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { fromAccountId, amount, recipientName, recipientBank, recipientAccount, description, frequency, startDate } = parsed.data;

  const [row] = await db.insert(scheduledTransfersTable).values({
    id: generateId(),
    userId: req.userId!,
    fromAccountId,
    amount: amount.toFixed(2),
    recipientName,
    recipientBank,
    recipientAccount,
    description,
    frequency,
    nextRunAt: new Date(startDate),
    status: "active",
  }).returning();

  res.status(201).json({
    ...row,
    amount: parseFloat(row.amount),
    nextRunAt: row.nextRunAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  });
});

router.delete("/scheduled-transfers/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = String(req.params["id"]);
  const [row] = await db.select().from(scheduledTransfersTable)
    .where(and(eq(scheduledTransfersTable.id, id), eq(scheduledTransfersTable.userId, req.userId!)));

  if (!row) {
    res.status(404).json({ error: "Scheduled transfer not found" });
    return;
  }

  await db.update(scheduledTransfersTable)
    .set({ status: "cancelled" })
    .where(and(eq(scheduledTransfersTable.id, id), eq(scheduledTransfersTable.userId, req.userId!)));

  res.status(204).end();
});

export default router;
