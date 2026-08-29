import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const patientsTable = pgTable("patients", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(), // caregiver who created it
  name: text("name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  bloodType: text("blood_type").notNull(),
  conditions: text("conditions").notNull().default("[]"), // JSON array
  allergies: text("allergies").notNull().default("[]"),   // JSON array
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  emergencyToken: text("emergency_token").notNull(),
  preferredLanguage: text("preferred_language").notNull().default("en"),
  dispensePinHash: text("dispense_pin_hash"), // bcrypt hash; null until the caregiver sets one in Settings
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const patientCaregiversTable = pgTable("patient_caregivers", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  caregiverId: integer("caregiver_id").notNull(),
  accessLevel: text("access_level").notNull().default("view"), // view | full
  status: text("status").notNull().default("pending"),         // pending | active
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPatientSchema = createInsertSchema(patientsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patientsTable.$inferSelect;
export type PatientCaregiver = typeof patientCaregiversTable.$inferSelect;
