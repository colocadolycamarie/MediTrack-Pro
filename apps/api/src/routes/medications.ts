import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, medicationsTable, schedulesTable } from "@dosemate/db";
import {
  CreateMedicationParams,
  CreateMedicationBody,
  GetMedicationParams,
  UpdateMedicationParams,
  UpdateMedicationBody,
  DeleteMedicationParams,
  ListMedicationsParams,
  CreateScheduleParams,
  CreateScheduleBody,
  UpdateScheduleParams,
  UpdateScheduleBody,
  DeleteScheduleParams,
  ListSchedulesParams,
} from "@dosemate/api-zod";

import { requireAuth } from "../middlewares/requireAuth";
import { computeNextDose, resolveClock, VALID_MEAL_RELATIONS } from "../lib/schedule";

const router: IRouter = Router();

// Scoped to /patients so public routes (e.g. /emergency/:token) further down the chain stay reachable.
router.use("/patients", requireAuth);

// Known drug interactions for demo
const INTERACTIONS: Record<string, string[]> = {
  "losartan": ["ibuprofen", "naproxen", "diclofenac"],
  "metformin": ["contrast dye", "alcohol"],
  "atorvastatin": ["gemfibrozil", "niacin", "cyclosporine"],
  "warfarin": ["aspirin", "ibuprofen", "naproxen"],
};

function checkInteraction(newDrug: string, existing: string[]): string | null {
  const lowerNew = newDrug.toLowerCase();
  const conflicts = INTERACTIONS[lowerNew] ?? [];
  for (const drug of existing) {
    if (conflicts.includes(drug.toLowerCase())) return drug;
    const otherConflicts = INTERACTIONS[drug.toLowerCase()] ?? [];
    if (otherConflicts.includes(lowerNew)) return drug;
  }
  return null;
}

function serializeMedication(m: typeof medicationsTable.$inferSelect, dosesPerDay = 1) {
  const stockCapacity = m.stockCapacity ?? 30;
  const stockPercentage = stockCapacity > 0 ? (m.stockCount / stockCapacity) * 100 : 0;
  const daysRemaining = dosesPerDay > 0 ? Math.floor(m.stockCount / dosesPerDay) : null;
  return {
    id: m.id,
    patientId: m.patientId,
    name: m.name,
    genericName: m.genericName,
    dosage: m.dosage,
    form: m.form,
    funnelNumber: m.funnelNumber,
    stockCount: m.stockCount,
    stockPercentage: Math.round(stockPercentage),
    daysRemaining,
    instructions: m.instructions,
    color: m.color,
    isLowStock: (daysRemaining !== null && daysRemaining <= 7) || stockPercentage < 20,
    createdAt: m.createdAt,
  };
}

function serializeSchedule(s: typeof schedulesTable.$inferSelect, nextDoseAt?: string | null) {
  return {
    id: s.id,
    medicationId: s.medicationId,
    timeType: s.timeType,
    clockTime: s.clockTime,
    mealRelation: s.mealRelation,
    daysOfWeek: JSON.parse(s.daysOfWeek || "[]"),
    nextDoseAt: nextDoseAt ?? null,
    createdAt: s.createdAt,
  };
}

const computeNextDoseAt = (schedule: typeof schedulesTable.$inferSelect): string | null => computeNextDose(schedule);

/** Average doses per day across a medication's schedules (empty days list = every day). */
function dosesPerDayFor(medicationId: number, schedules: Array<typeof schedulesTable.$inferSelect>): number {
  const mine = schedules.filter(sc => sc.medicationId === medicationId);
  if (mine.length === 0) return 1; // no schedule yet: keep the old "1 per day" estimate
  return mine.reduce((sum, sc) => {
    let days: unknown = [];
    try { days = JSON.parse(sc.daysOfWeek || "[]"); } catch { /* treat as every day */ }
    const perWeek = Array.isArray(days) && days.length > 0 ? days.length : 7;
    return sum + perWeek / 7;
  }, 0);
}

/** A medication id from the URL only counts if it really belongs to the patient in the URL. */
async function medicationBelongsToPatient(patientId: number, medicationId: number): Promise<boolean> {
  const [med] = await db.select().from(medicationsTable)
    .where(and(eq(medicationsTable.id, medicationId), eq(medicationsTable.patientId, patientId))).limit(1);
  return Boolean(med);
}

type ScheduleCandidate = { timeType: string; clockTime: string | null; mealRelation: string | null };

/** Returns an error message if the schedule couldn't actually fire, otherwise null. */
function validateSchedule(sc: ScheduleCandidate): string | null {
  if (sc.timeType === "clock") {
    if (!resolveClock({ ...sc, timeType: "clock" })) return "Enter a valid time (HH:MM, 24-hour) for a clock-time schedule.";
    return null;
  }
  if (sc.timeType === "meal_relative") {
    if (!sc.mealRelation || !(VALID_MEAL_RELATIONS as readonly string[]).includes(sc.mealRelation)) {
      return "Choose before/after breakfast, lunch or dinner for a meal-relative schedule.";
    }
    return null;
  }
  return "Unknown schedule type.";
}

router.get("/patients/:patientId/medications", async (req, res): Promise<void> => {
  const params = ListMedicationsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const meds = await db.select().from(medicationsTable)
    .where(eq(medicationsTable.patientId, params.data.patientId));
  const schedules = await db.select().from(schedulesTable)
    .where(eq(schedulesTable.patientId, params.data.patientId));
  res.json(meds.map(m => serializeMedication(m, dosesPerDayFor(m.id, schedules))));
});

router.post("/patients/:patientId/medications", async (req, res): Promise<void> => {
  const params = CreateMedicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateMedicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Check drug interactions
  const existing = await db.select().from(medicationsTable)
    .where(eq(medicationsTable.patientId, params.data.patientId));
  const conflict = checkInteraction(parsed.data.name, existing.map(m => m.name));
  if (conflict) {
    res.status(409).json({
      warning: `${parsed.data.name} may interact with ${conflict}. Review with a physician before proceeding.`,
      conflictingMedications: [conflict],
      canOverride: true,
    });
    return;
  }

  const [med] = await db.insert(medicationsTable).values({
    patientId: params.data.patientId,
    name: parsed.data.name,
    genericName: parsed.data.genericName ?? null,
    dosage: parsed.data.dosage,
    form: parsed.data.form ?? "tablet",
    funnelNumber: parsed.data.funnelNumber,
    stockCount: parsed.data.stockCount,
    stockCapacity: 30,
    instructions: parsed.data.instructions ?? null,
    color: parsed.data.color ?? null,
  }).returning();

  res.status(201).json(serializeMedication(med));
});

router.get("/patients/:patientId/medications/:medicationId", async (req, res): Promise<void> => {
  const params = GetMedicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [med] = await db.select().from(medicationsTable)
    .where(and(
      eq(medicationsTable.id, params.data.medicationId),
      eq(medicationsTable.patientId, params.data.patientId),
    )).limit(1);
  if (!med) {
    res.status(404).json({ error: "Medication not found." });
    return;
  }
  res.json(serializeMedication(med));
});

router.patch("/patients/:patientId/medications/:medicationId", async (req, res): Promise<void> => {
  const params = UpdateMedicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateMedicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [med] = await db.update(medicationsTable).set(parsed.data)
    .where(and(
      eq(medicationsTable.id, params.data.medicationId),
      eq(medicationsTable.patientId, params.data.patientId),
    )).returning();
  if (!med) {
    res.status(404).json({ error: "Medication not found." });
    return;
  }
  res.json(serializeMedication(med));
});

router.delete("/patients/:patientId/medications/:medicationId", async (req, res): Promise<void> => {
  const params = DeleteMedicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const removed = await db.delete(medicationsTable).where(and(
    eq(medicationsTable.id, params.data.medicationId),
    eq(medicationsTable.patientId, params.data.patientId),
  )).returning({ id: medicationsTable.id });
  if (removed.length > 0) {
    await db.delete(schedulesTable).where(and(
      eq(schedulesTable.medicationId, params.data.medicationId),
      eq(schedulesTable.patientId, params.data.patientId),
    ));
  }
  res.json({ success: true, message: "Medication deleted." });
});

router.get("/patients/:patientId/medications/:medicationId/schedules", async (req, res): Promise<void> => {
  const params = ListSchedulesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!(await medicationBelongsToPatient(params.data.patientId, params.data.medicationId))) {
    res.status(404).json({ error: "Medication not found." });
    return;
  }
  const schedules = await db.select().from(schedulesTable)
    .where(and(
      eq(schedulesTable.medicationId, params.data.medicationId),
      eq(schedulesTable.patientId, params.data.patientId),
    ));
  res.json(schedules.map(s => serializeSchedule(s, computeNextDoseAt(s))));
});

router.post("/patients/:patientId/medications/:medicationId/schedules", async (req, res): Promise<void> => {
  const params = CreateScheduleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateScheduleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!(await medicationBelongsToPatient(params.data.patientId, params.data.medicationId))) {
    res.status(404).json({ error: "Medication not found." });
    return;
  }

  const candidate = {
    timeType: parsed.data.timeType,
    clockTime: parsed.data.clockTime ?? null,
    mealRelation: parsed.data.mealRelation && String(parsed.data.mealRelation) !== "null" ? String(parsed.data.mealRelation) : null,
  };
  const problem = validateSchedule(candidate);
  if (problem) {
    res.status(400).json({ error: problem });
    return;
  }

  const [schedule] = await db.insert(schedulesTable).values({
    medicationId: params.data.medicationId,
    patientId: params.data.patientId,
    timeType: candidate.timeType,
    clockTime: candidate.timeType === "clock" ? candidate.clockTime : null,
    mealRelation: candidate.timeType === "meal_relative" ? candidate.mealRelation : null,
    daysOfWeek: JSON.stringify(parsed.data.daysOfWeek ?? []),
  }).returning();
  res.status(201).json(serializeSchedule(schedule, computeNextDoseAt(schedule)));
});

router.patch("/patients/:patientId/medications/:medicationId/schedules/:scheduleId", async (req, res): Promise<void> => {
  const params = UpdateScheduleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateScheduleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Scope by patient AND medication AND schedule id — the schedule id alone is not proof of ownership.
  const scope = and(
    eq(schedulesTable.id, params.data.scheduleId),
    eq(schedulesTable.medicationId, params.data.medicationId),
    eq(schedulesTable.patientId, params.data.patientId),
  );
  const [existing] = await db.select().from(schedulesTable).where(scope).limit(1);
  if (!existing) {
    res.status(404).json({ error: "Schedule not found." });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.daysOfWeek !== undefined) {
    updateData.daysOfWeek = JSON.stringify(parsed.data.daysOfWeek);
  }

  const merged = {
    timeType: (parsed.data.timeType ?? existing.timeType) as string,
    clockTime: parsed.data.clockTime !== undefined ? parsed.data.clockTime : existing.clockTime,
    mealRelation: parsed.data.mealRelation !== undefined ? parsed.data.mealRelation : existing.mealRelation,
  };
  const problem = validateSchedule(merged);
  if (problem) {
    res.status(400).json({ error: problem });
    return;
  }
  if (merged.timeType === "clock") updateData.mealRelation = null;
  if (merged.timeType === "meal_relative") updateData.clockTime = null;

  const [schedule] = await db.update(schedulesTable).set(updateData).where(scope).returning();
  if (!schedule) {
    res.status(404).json({ error: "Schedule not found." });
    return;
  }
  res.json(serializeSchedule(schedule, computeNextDoseAt(schedule)));
});

router.delete("/patients/:patientId/medications/:medicationId/schedules/:scheduleId", async (req, res): Promise<void> => {
  const params = DeleteScheduleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const removed = await db.delete(schedulesTable).where(and(
    eq(schedulesTable.id, params.data.scheduleId),
    eq(schedulesTable.medicationId, params.data.medicationId),
    eq(schedulesTable.patientId, params.data.patientId),
  )).returning({ id: schedulesTable.id });
  if (removed.length === 0) {
    res.status(404).json({ error: "Schedule not found." });
    return;
  }
  res.json({ success: true, message: "Schedule deleted." });
});

export default router;
