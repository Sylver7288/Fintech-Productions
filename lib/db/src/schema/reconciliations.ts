import { integer, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reconciliationsTable = pgTable("reconciliations", {
  id: text("id").primaryKey(),
  reportDate: timestamp("report_date", { withTimezone: true }).notNull(),
  fileName: text("file_name").notNull(),
  totalTransactions: integer("total_transactions").notNull(),
  matchedCount: integer("matched_count").notNull(),
  unmatchedCount: integer("unmatched_count").notNull(),
  status: text("status").notNull(), // "balanced", "discrepancies"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reconciliationLogsTable = pgTable("reconciliation_logs", {
  id: text("id").primaryKey(),
  reconciliationId: text("reconciliation_id").notNull(),
  transactionReference: text("transaction_reference").notNull(),
  amountInternal: numeric("amount_internal", { precision: 15, scale: 2 }),
  amountNibss: numeric("amount_nibss", { precision: 15, scale: 2 }),
  statusInternal: text("status_internal"),
  statusNibss: text("status_nibss"),
  comparisonResult: text("comparison_result").notNull(), // "matched", "missing_in_internal", "missing_in_nibss", "amount_mismatch", "status_mismatch"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReconciliationSchema = createInsertSchema(reconciliationsTable).omit({ createdAt: true });
export type InsertReconciliation = z.infer<typeof insertReconciliationSchema>;
export type Reconciliation = typeof reconciliationsTable.$inferSelect;

export const insertReconciliationLogSchema = createInsertSchema(reconciliationLogsTable).omit({ createdAt: true });
export type InsertReconciliationLog = z.infer<typeof insertReconciliationLogSchema>;
export type ReconciliationLog = typeof reconciliationLogsTable.$inferSelect;
