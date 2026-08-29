import { Router, type IRouter } from "express";
import { eq, and, gte, lte } from "drizzle-orm";
import { db, patientsTable, medicationsTable, schedulesTable, doseEventsTable, devicesTable } from "@meditrack/db";
import {
  GetDashboardSummaryParams,
  GetEmergencyQrParams,
  GetEmergencyPublicProfileParams,
} from "@meditrack/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

/**
 * Dose events are the only thing `confirmDose` can act on, but nothing ever
 * created one from a schedule — the dashboard used to synthesize a plain
 * object (no id, status stuck at "pending"/"overdue") that could never
 * actually be confirmed taken. This materializes today's real, persisted
 * DoseEvent rows from each active schedule the first time they're needed,
 * and is safe to call on every request: it only inserts a row for a given
 * (patient, medication, scheduled time) once.
 */
async function materializeTodaysDoseEvents(patientId: number) {
  const meds = await db.select().from(medicationsTable).where(eq(medicationsTable.patientId, patientId));
  const schedules = await db.select().from(schedulesTable).where(eq(schedulesTable.patientId, patientId));

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const todaysEvents = await db.select().from(doseEventsTable).where(and(
    eq(doseEventsTable.patientId, patientId),
    gte(doseEventsTable.scheduledAt, startOfDay),
    lte(doseEventsTable.scheduledAt, endOfDay),
  ));

  for (const schedule of schedules) {
    const med = meds.find(m => m.id === schedule.medicationId);
    if (!med || !schedule.clockTime) continue;

    const [hour, minute] = schedule.clockTime.split(":").map(Number);
    const scheduledAt = new Date();
    scheduledAt.setHours(hour, minute, 0, 0);

    const alreadyExists = todaysEvents.some(
      e => e.medicationId === med.id && e.scheduledAt.getHours() === hour && e.scheduledAt.getMinutes() === minute,
    );
    if (alreadyExists) continue;

    const [inserted] = await db.insert(doseEventsTable).values({
      patientId,
      medicationId: med.id,
      scheduledAt,
      status: "pending",
    }).returning();
    todaysEvents.push(inserted);
  }

  return { meds, todaysEvents };
}

// NOTE: /emergency/:token below is intentionally public (zero-login QR scan
// flow) and must not be gated by requireAuth — every other route in this
// file is a caregiver-only resource and needs it.
router.get("/patients/:patientId/dashboard", requireAuth, async (req, res): Promise<void> => {
  const params = GetDashboardSummaryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [patient] = await db.select().from(patientsTable)
    .where(eq(patientsTable.id, params.data.patientId)).limit(1);
  if (!patient) {
    res.status(404).json({ error: "Patient not found." });
    return;
  }

  const { meds, todaysEvents } = await materializeTodaysDoseEvents(params.data.patientId);
  const allSchedules = await db.select().from(schedulesTable)
    .where(eq(schedulesTable.patientId, params.data.patientId));
  const [device] = await db.select().from(devicesTable)
    .where(eq(devicesTable.patientId, params.data.patientId)).limit(1);
  const events = await db.select().from(doseEventsTable)
    .where(eq(doseEventsTable.patientId, params.data.patientId));

  const taken = events.filter(e => e.status === "taken").length;
  const total = events.length;
  const adherenceRate = total > 0 ? Math.round((taken / total) * 100) : 100;

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const dayStr = day.toDateString();
    const dayEvents = events.filter(e => new Date(e.scheduledAt).toDateString() === dayStr);
    if (dayEvents.length === 0 && i > 0) break;
    if (dayEvents.length > 0 && !dayEvents.every(e => e.status === "taken")) break;
    if (dayEvents.length > 0) streak++;
  }

  const dosesTakenToday = todaysEvents.filter(e => e.status === "taken").length;

  // Upcoming doses — now real DoseEvent rows, so `doseEventId` can actually be confirmed
  const upcomingDoses = todaysEvents.map(e => {
    const med = meds.find(m => m.id === e.medicationId);
    const minutesUntilDue = Math.round((e.scheduledAt.getTime() - today.getTime()) / 60000);
    let status: "pending" | "taken" | "missed" | "overdue" = e.status as "pending" | "taken" | "missed";
    if (status === "pending" && minutesUntilDue < -15) status = "overdue";
    return {
      doseEventId: e.id,
      medicationId: e.medicationId,
      medicationName: med?.name ?? "Unknown medication",
      dosage: med?.dosage,
      scheduledAt: e.scheduledAt.toISOString(),
      status,
      minutesUntilDue,
    };
  }).sort((a, b) => a.minutesUntilDue - b.minutesUntilDue);

  const futureDoses = upcomingDoses.filter(d => d.status === "pending" && d.minutesUntilDue >= 0);
  const nextDose = futureDoses[0] ?? null;

  const stockAlerts = meds
    .filter(m => m.stockCount <= 5 || m.stockCount / (m.stockCapacity ?? 30) < 0.2)
    .map(m => ({
      medicationName: m.name,
      daysRemaining: Math.floor(m.stockCount / Math.max(allSchedules.filter(s => s.medicationId === m.id).length, 1)),
      funnelNumber: m.funnelNumber,
    }));

  const trendFlags = [];
  const weekendMissed = events.filter(e => {
    const day = new Date(e.scheduledAt).getDay();
    return (day === 0 || day === 6) && e.status === "missed";
  });
  if (weekendMissed.length >= 2) {
    trendFlags.push({
      id: "weekend-misses",
      type: "weekend_misses",
      message: "Weekend misses detected. Set a recurring reminder.",
      severity: "warning",
      detectedAt: new Date().toISOString(),
    });
  }

  res.json({
    patientId: patient.id,
    patientName: patient.name,
    conditions: JSON.parse(patient.conditions || "[]"),
    allergies: JSON.parse(patient.allergies || "[]"),
    nextDoseAt: nextDose?.scheduledAt ?? null,
    minutesUntilNextDose: nextDose?.minutesUntilDue ?? null,
    upcomingDoses,
    adherenceRate,
    currentStreak: streak,
    dosesToday: todaysEvents.length,
    dosesTakenToday,
    stockAlerts,
    deviceStatus: device?.status ?? "unpaired",
    trendFlags,
  });
});

router.get("/patients/:patientId/emergency-qr", requireAuth, async (req, res): Promise<void> => {
  const params = GetEmergencyQrParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [patient] = await db.select().from(patientsTable)
    .where(eq(patientsTable.id, params.data.patientId)).limit(1);
  if (!patient) {
    res.status(404).json({ error: "Patient not found." });
    return;
  }

  const qrUrl = `/emergency/${patient.emergencyToken}`;
  res.json({
    patientId: patient.id,
    token: patient.emergencyToken,
    qrUrl,
    generatedAt: patient.createdAt.toISOString(),
  });
});

router.get("/emergency/:token", async (req, res): Promise<void> => {
  const params = GetEmergencyPublicProfileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [patient] = await db.select().from(patientsTable)
    .where(eq(patientsTable.emergencyToken, params.data.token)).limit(1);
  if (!patient) {
    res.status(404).json({ error: "Emergency profile not found or QR code is invalid." });
    return;
  }
  const meds = await db.select().from(medicationsTable)
    .where(eq(medicationsTable.patientId, patient.id));

  res.json({
    name: patient.name,
    dateOfBirth: patient.dateOfBirth,
    bloodType: patient.bloodType,
    conditions: JSON.parse(patient.conditions || "[]"),
    allergies: JSON.parse(patient.allergies || "[]"),
    medications: meds.map(m => ({ name: m.name, dosage: m.dosage, form: m.form })),
    emergencyContactName: patient.emergencyContactName,
    emergencyContactPhone: patient.emergencyContactPhone,
  });
});

export default router;
