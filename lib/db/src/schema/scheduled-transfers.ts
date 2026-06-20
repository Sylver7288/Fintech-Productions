import { numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scheduledTransfersTable = pgTable("scheduled_transfers", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  fromAccountId: text("from_account_id").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  recipientName: text("recipient_name").notNull(),
  recipientBank: text("recipient_bank").notNull(),
  recipientAccount: text("recipient_account").notNull(),
  description: text("description").notNull(),
  frequency: text("frequency").notNull().default("once"),
  nextRunAt: timestamp("next_run_at", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertScheduledTransferSchema = createInsertSchema(scheduledTransfersTable).omit({ createdAt: true });
export type InsertScheduledTransfer = z.infer<typeof insertScheduledTransferSchema>;
export type ScheduledTransfer = typeof scheduledTransfersTable.$inferSelect;
