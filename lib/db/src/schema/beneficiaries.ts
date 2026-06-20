import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const beneficiariesTable = pgTable("beneficiaries", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  bank: text("bank").notNull(),
  accountNumber: text("account_number").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
