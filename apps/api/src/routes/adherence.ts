import { Router, type IRouter } from "express";
import { eq, and, gte, desc } from "drizzle-orm";
import { db, doseEventsTable, medicationsTable, schedulesTable, patientsTable, notificationSettingsTable } from "@meditrack/db";
import {
  ListAdherenceLogsParams,
  ConfirmDoseParams,
  ConfirmDoseBody,
  GetAdherenceSummaryParams,
  GetWeeklyAdherenceParams,
  GetAdherenceTrendsParams,
  ExportAdherenceReportParams,
  GetNotificationSettingsParams,
  UpdateNotificationSettingsParams,
  UpdateNotificationSettingsBody,
} from "@meditrack/api-zod";
import { randomBytes } from "crypto";

import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.use(requireAuth);

function serializeDoseEvent(e: typeof doseEventsTable.$inferSelect, medicationName = "Unknown") {
  return {
    id: e.id,
    patientId: e.patientId,
    medicationId: e.medicationId,
    medicationName,
    scheduledAt: e.scheduledAt,
    confirmedAt: e.confirmedAt,
    status: e.status,
  };
}

router.get("/patients/:patientId/adherence", async (req, res): Promise<void> => {
  const params = ListAdherenceLogsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const events = await db.select().from(doseEventsTable)
    .where(eq(doseEventsTable.patientId, params.data.patientId))
    .orderBy(desc(doseEventsTable.scheduledAt))
    .limit(100);

  const meds = await db.select().from(medicationsTable)
    .where(eq(medicationsTable.patientId, params.data.patientId));
  const medMap = new Map(meds.map(m => [m.id, m.name]));

  res.json(events.map(e => serializeDoseEvent(e, medMap.get(e.medicationId))));
});

router.post("/patients/:patientId/adherence/:doseEventId/confirm", async (req, res): Promise<void> => {
  const params = ConfirmDoseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = ConfirmDoseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [event] = await db.update(doseEventsTable)
    .set({
      status: "taken",
      confirmedAt: new Date(parsed.data.confirmedAt as unknown as string),
      method: parsed.data.method ?? "tap",
    })
    .where(and(
      eq(doseEventsTable.id, params.data.doseEventId),
      eq(doseEventsTable.patientId, params.data.patientId),
    ))
    .returning();

  if (!event) {
    res.status(404).json({ error: "Dose event not found." });
    return;
  }

  const meds = await db.select().from(medicationsTable)
    .where(eq(medicationsTable.patientId, params.data.patientId));
  const medMap = new Map(meds.map(m => [m.id, m.name]));
  res.json(serializeDoseEvent(event, medMap.get(event.medicationId)));
});

router.get("/patients/:patientId/adherence/summary", async (req, res): Promise<void> => {
  const params = GetAdherenceSummaryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const events = await db.select().from(doseEventsTable)
    .where(eq(doseEventsTable.patientId, params.data.patientId));

  const taken = events.filter(e => e.status === "taken").length;
  const missed = events.filter(e => e.status === "missed").length;
  const total = events.length;
  const rate = total > 0 ? Math.round((taken / total) * 100) : 0;

  // Compute streak
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const dayStr = day.toDateString();
    const dayEvents = events.filter(e => new Date(e.scheduledAt).toDateString() === dayStr);
    if (dayEvents.length === 0) break;
    const allTaken = dayEvents.every(e => e.status === "taken");
    if (!allTaken) break;
    streak++;
  }

  res.json({
    patientId: params.data.patientId,
    overallRate: rate,
    currentStreak: streak,
    takenCount: taken,
    missedCount: missed,
    totalCount: total,
    lastUpdated: new Date().toISOString(),
  });
});

router.get("/patients/:patientId/adherence/weekly", async (req, res): Promise<void> => {
  const params = GetWeeklyAdherenceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const events = await db.select().from(doseEventsTable)
    .where(eq(doseEventsTable.patientId, params.data.patientId));

  const result = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const dateStr = day.toISOString().split("T")[0];
    const dayEvents = events.filter(e => new Date(e.scheduledAt).toISOString().split("T")[0] === dateStr);
    const taken = dayEvents.filter(e => e.status === "taken").length;
    const missed = dayEvents.filter(e => e.status === "missed").length;
    const total = dayEvents.length;
    result.push({
      date: dateStr,
      taken,
      missed,
      total,
      rate: total > 0 ? Math.round((taken / total) * 100) : 0,
    });
  }
  res.json(result);
});

router.get("/patients/:patientId/adherence/trends", async (req, res): Promise<void> => {
  const params = GetAdherenceTrendsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const events = await db.select().from(doseEventsTable)
    .where(eq(doseEventsTable.patientId, params.data.patientId));

  const flags = [];
  // Check for weekend misses
  const weekendMissed = events.filter(e => {
    const day = new Date(e.scheduledAt).getDay();
    return (day === 0 || day === 6) && e.status === "missed";
  });
  if (weekendMissed.length >= 2) {
    flags.push({
      id: "weekend-misses",
      type: "weekend_misses",
      message: "Missed doses cluster on weekends. Consider setting a recurring weekend reminder.",
      severity: "warning",
      detectedAt: new Date().toISOString(),
    });
  }

  // Check for streak risk
  const recentMissed = events
    .filter(e => e.status === "missed")
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    .slice(0, 3);
  if (recentMissed.length >= 2) {
    flags.push({
      id: "streak-risk",
      type: "streak_risk",
      message: "Multiple recent missed doses detected. Check in with Juanita.",
      severity: "critical",
      detectedAt: new Date().toISOString(),
    });
  }

  const takenCount = events.filter(e => e.status === "taken").length;
  if (takenCount >= 7 && events.filter(e => e.status === "missed").length === 0) {
    flags.push({
      id: "perfect-week",
      type: "perfect_week",
      message: "Perfect adherence this week! Streak is building.",
      severity: "info",
      detectedAt: new Date().toISOString(),
    });
  }

  res.json(flags);
});

router.get("/patients/:patientId/adherence/export", async (req, res): Promise<void> => {
  const params = ExportAdherenceReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [patient] = await db.select().from(patientsTable)
    .where(eq(patientsTable.id, params.data.patientId)).limit(1);
  const events = await db.select().from(doseEventsTable)
    .where(eq(doseEventsTable.patientId, params.data.patientId))
    .orderBy(desc(doseEventsTable.scheduledAt));
  const meds = await db.select().from(medicationsTable)
    .where(eq(medicationsTable.patientId, params.data.patientId));
  const medMap = new Map(meds.map(m => [m.id, m.name]));

  const taken = events.filter(e => e.status === "taken").length;
  const missed = events.filter(e => e.status === "missed").length;
  const total = events.length;

  res.json({
    patientId: params.data.patientId,
    patientName: patient?.name ?? "Unknown Patient",
    generatedAt: new Date().toISOString(),
    shareToken: randomBytes(12).toString("hex"),
    summary: {
      patientId: params.data.patientId,
      overallRate: total > 0 ? Math.round((taken / total) * 100) : 0,
      currentStreak: 0,
      takenCount: taken,
      missedCount: missed,
      totalCount: total,
      lastUpdated: new Date().toISOString(),
    },
    doseEvents: events.slice(0, 30).map(e => serializeDoseEvent(e, medMap.get(e.medicationId))),
  });
});

// Notification settings
router.get("/patients/:patientId/notifications", async (req, res): Promise<void> => {
  const params = GetNotificationSettingsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  let [settings] = await db.select().from(notificationSettingsTable)
    .where(eq(notificationSettingsTable.patientId, params.data.patientId)).limit(1);

  if (!settings) {
    [settings] = await db.insert(notificationSettingsTable).values({
      patientId: params.data.patientId,
      pushEnabled: 1,
      smsEnabled: 0,
      smsPhone: null,
      weeklyDigestEnabled: 1,
      reminderMinutesBefore: 15,
      language: "en",
      largerTextEnabled: 0,
      highContrastEnabled: 0,
    }).returning();
  }

  res.json({
    patientId: settings.patientId,
    pushEnabled: settings.pushEnabled === 1,
    smsEnabled: settings.smsEnabled === 1,
    smsPhone: settings.smsPhone,
    weeklyDigestEnabled: settings.weeklyDigestEnabled === 1,
    reminderMinutesBefore: settings.reminderMinutesBefore,
    language: settings.language,
    largerTextEnabled: settings.largerTextEnabled === 1,
    highContrastEnabled: settings.highContrastEnabled === 1,
  });
});

router.patch("/patients/:patientId/notifications", async (req, res): Promise<void> => {
  const params = UpdateNotificationSettingsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateNotificationSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.pushEnabled !== undefined) updateData.pushEnabled = parsed.data.pushEnabled ? 1 : 0;
  if (parsed.data.smsEnabled !== undefined) updateData.smsEnabled = parsed.data.smsEnabled ? 1 : 0;
  if (parsed.data.smsPhone !== undefined) updateData.smsPhone = parsed.data.smsPhone;
  if (parsed.data.weeklyDigestEnabled !== undefined) updateData.weeklyDigestEnabled = parsed.data.weeklyDigestEnabled ? 1 : 0;
  if (parsed.data.reminderMinutesBefore !== undefined) updateData.reminderMinutesBefore = parsed.data.reminderMinutesBefore;
  if (parsed.data.language !== undefined) updateData.language = parsed.data.language;
  if (parsed.data.largerTextEnabled !== undefined) updateData.largerTextEnabled = parsed.data.largerTextEnabled ? 1 : 0;
  if (parsed.data.highContrastEnabled !== undefined) updateData.highContrastEnabled = parsed.data.highContrastEnabled ? 1 : 0;

  const [settings] = await db.update(notificationSettingsTable)
    .set(updateData)
    .where(eq(notificationSettingsTable.patientId, params.data.patientId))
    .returning();

  res.json({
    patientId: settings.patientId,
    pushEnabled: settings.pushEnabled === 1,
    smsEnabled: settings.smsEnabled === 1,
    smsPhone: settings.smsPhone,
    weeklyDigestEnabled: settings.weeklyDigestEnabled === 1,
    reminderMinutesBefore: settings.reminderMinutesBefore,
    language: settings.language,
    largerTextEnabled: settings.largerTextEnabled === 1,
    highContrastEnabled: settings.highContrastEnabled === 1,
  });
});

export default router;
