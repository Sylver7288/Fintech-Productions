import { boolean, numeric, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transactionsTable = pgTable("transactions", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  type: text("type").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  fee: numeric("fee", { precision: 15, scale: 2 }).notNull().default("0.00"),
  currency: varchar("currency", { length: 3 }).notNull().default("NGN"),
  description: text("description").notNull(),
  status: text("status").notNull().default("completed"),
  reference: text("reference").notNull().unique(),
  category: text("category"),
  recipientName: text("recipient_name"),
  recipientBank: text("recipient_bank"),
  recipientAccount: text("recipient_account"),
  senderName: text("sender_name"),
  isReversed: boolean("is_reversed").notNull().default(false),
  reversedAt: timestamp("reversed_at", { withTimezone: true }),
  reversedByAdminId: text("reversed_by_admin_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ createdAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
