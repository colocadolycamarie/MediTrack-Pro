import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const devicesTable = pgTable("devices", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  nickname: text("nickname").notNull().default("MediTrack Dispenser"),
  deviceCode: text("device_code").notNull(),
  status: text("status").notNull().default("online"), // online | offline | error
  wifiStrength: integer("wifi_strength"),
  lastSeenAt: timestamp("last_seen_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deviceLogsTable = pgTable("device_logs", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").notNull(),
  event: text("event").notNull(), // dispense | missed | jam | refill | online | offline | error
  message: text("message").notNull(),
  funnelNumber: integer("funnel_number"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertDeviceSchema = createInsertSchema(devicesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Device = typeof devicesTable.$inferSelect;
export type DeviceLog = typeof deviceLogsTable.$inferSelect;
