import { integer, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const loansTable = pgTable("loans", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  accountId: text("account_id").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  purpose: text("purpose").notNull(),
  status: text("status").notNull().default("pending"),
  monthlyRate: numeric("monthly_rate", { precision: 5, scale: 2 }).notNull().default("2.50"),
  durationMonths: integer("duration_months").notNull().default(3),
  repaidAmount: numeric("repaid_amount", { precision: 15, scale: 2 }).notNull().default("0"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLoanSchema = createInsertSchema(loansTable).omit({ createdAt: true, updatedAt: true });
export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type Loan = typeof loansTable.$inferSelect;
