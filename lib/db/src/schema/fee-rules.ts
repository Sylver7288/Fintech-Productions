import { boolean, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const feeRulesTable = pgTable("fee_rules", {
  id: text("id").primaryKey(),
  transactionType: text("transaction_type").notNull(), // e.g., "transfer", "airtime", "bills"
  feeType: text("fee_type").notNull(), // "fixed" or "percentage"
  value: numeric("value", { precision: 15, scale: 4 }).notNull(), // e.g. 50.00 (Naira) or 0.015 (1.5%)
  minAmount: numeric("min_amount", { precision: 15, scale: 2 }).notNull().default("0.00"),
  maxAmount: numeric("max_amount", { precision: 15, scale: 2 }), // optional upper threshold
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFeeRuleSchema = createInsertSchema(feeRulesTable).omit({ createdAt: true, updatedAt: true });
export type InsertFeeRule = z.infer<typeof insertFeeRuleSchema>;
export type FeeRule = typeof feeRulesTable.$inferSelect;
