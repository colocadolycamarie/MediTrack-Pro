import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const doseEventsTable = pgTable("dose_events", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  medicationId: integer("medication_id").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  confirmedAt: timestamp("confirmed_at"),
  status: text("status").notNull().default("pending"), // pending | taken | missed | snoozed
  method: text("method"),  // tap | voice | auto
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notificationSettingsTable = pgTable("notification_settings", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().unique(),
  pushEnabled: integer("push_enabled").notNull().default(1),      // 0|1
  smsEnabled: integer("sms_enabled").notNull().default(0),
  smsPhone: text("sms_phone"),
  weeklyDigestEnabled: integer("weekly_digest_enabled").notNull().default(1),
  reminderMinutesBefore: integer("reminder_minutes_before").notNull().default(15),
  language: text("language").notNull().default("en"),
  largerTextEnabled: integer("larger_text_enabled").notNull().default(0),
  highContrastEnabled: integer("high_contrast_enabled").notNull().default(0),
});

export const insertDoseEventSchema = createInsertSchema(doseEventsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertDoseEvent = z.infer<typeof insertDoseEventSchema>;
export type DoseEvent = typeof doseEventsTable.$inferSelect;
export type NotificationSettings = typeof notificationSettingsTable.$inferSelect;
