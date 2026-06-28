import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const supportSettingsTable = pgTable("support_settings", {
  id: text("id").primaryKey(), // Fixed ID like "global"
  email: text("email").notNull().default("support@novamoni.ng"),
  whatsapp: text("whatsapp").notNull().default("https://wa.me/2348000000000"),
  liveChatUrl: text("live_chat_url").notNull().default("https://example.com/live-chat"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSupportSettingsSchema = createInsertSchema(supportSettingsTable).omit({ updatedAt: true });
export type InsertSupportSettings = z.infer<typeof insertSupportSettingsSchema>;
export type SupportSettings = typeof supportSettingsTable.$inferSelect;
