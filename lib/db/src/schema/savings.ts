import { date, numeric, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const savingsTable = pgTable("savings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  targetAmount: numeric("target_amount", { precision: 15, scale: 2 }).notNull(),
  currentAmount: numeric("current_amount", { precision: 15, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 3 }).notNull().default("NGN"),
  emoji: text("emoji"),
  color: text("color"),
  status: text("status").notNull().default("active"),
  targetDate: date("target_date", { mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSavingsSchema = createInsertSchema(savingsTable).omit({ createdAt: true, updatedAt: true });
export type InsertSavings = z.infer<typeof insertSavingsSchema>;
export type Savings = typeof savingsTable.$inferSelect;
