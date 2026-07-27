import { pgTable, serial, text, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const medicationsTable = pgTable("medications", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  name: text("name").notNull(),
  genericName: text("generic_name"),
  dosage: text("dosage").notNull(),
  form: text("form").notNull().default("tablet"),
  funnelNumber: integer("funnel_number").notNull(),
  stockCount: integer("stock_count").notNull().default(0),
  stockCapacity: integer("stock_capacity").notNull().default(30),
  instructions: text("instructions"),
  color: text("color"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const schedulesTable = pgTable("schedules", {
  id: serial("id").primaryKey(),
  medicationId: integer("medication_id").notNull(),
  patientId: integer("patient_id").notNull(),
  timeType: text("time_type").notNull().default("clock"), // clock | meal_relative
  clockTime: text("clock_time"),    // e.g. "08:00"
  mealRelation: text("meal_relation"), // before_breakfast | after_breakfast | etc.
  daysOfWeek: text("days_of_week").notNull().default("[]"), // JSON array
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMedicationSchema = createInsertSchema(medicationsTable).omit({
  id: true,
  createdAt: true,
});

export const insertScheduleSchema = createInsertSchema(schedulesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type Medication = typeof medicationsTable.$inferSelect;
export type Schedule = typeof schedulesTable.$inferSelect;
