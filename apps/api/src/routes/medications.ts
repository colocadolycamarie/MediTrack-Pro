import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, medicationsTable, schedulesTable } from "@meditrack/db";
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
} from "@meditrack/api-zod";

import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.use(requireAuth);

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

function computeNextDoseAt(schedule: typeof schedulesTable.$inferSelect): string | null {
  if (schedule.timeType === "clock" && schedule.clockTime) {
    const [hour, minute] = schedule.clockTime.split(":").map(Number);
    const now = new Date();
    const next = new Date(now);
    next.setHours(hour, minute, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next.toISOString();
  }
  return null;
}

// List medications
router.get("/patients/:patientId/medications", async (req, res): Promise<void> => {
  const params = ListMedicationsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const meds = await db.select().from(medicationsTable)
    .where(eq(medicationsTable.patientId, params.data.patientId));
  res.json(meds.map(m => serializeMedication(m)));
});

// Create medication
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

// Get medication
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

// Update medication
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

// Delete medication
router.delete("/patients/:patientId/medications/:medicationId", async (req, res): Promise<void> => {
  const params = DeleteMedicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(medicationsTable).where(and(
    eq(medicationsTable.id, params.data.medicationId),
    eq(medicationsTable.patientId, params.data.patientId),
  ));
  res.json({ success: true, message: "Medication deleted." });
});

// Schedules
router.get("/patients/:patientId/medications/:medicationId/schedules", async (req, res): Promise<void> => {
  const params = ListSchedulesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
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
  const [schedule] = await db.insert(schedulesTable).values({
    medicationId: params.data.medicationId,
    patientId: params.data.patientId,
    timeType: parsed.data.timeType,
    clockTime: parsed.data.clockTime ?? null,
    mealRelation: parsed.data.mealRelation ?? null,
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
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.daysOfWeek !== undefined) {
    updateData.daysOfWeek = JSON.stringify(parsed.data.daysOfWeek);
  }
  const [schedule] = await db.update(schedulesTable).set(updateData)
    .where(eq(schedulesTable.id, params.data.scheduleId))
    .returning();
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
  await db.delete(schedulesTable).where(eq(schedulesTable.id, params.data.scheduleId));
  res.json({ success: true, message: "Schedule deleted." });
});

export default router;
