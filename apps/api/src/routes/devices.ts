import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, devicesTable, deviceLogsTable, medicationsTable, patientsTable } from "@meditrack/db";
import {
  ListDevicesParams,
  PairDeviceParams,
  PairDeviceBody,
  GetDeviceParams,
  ManualDispenseParams,
  ManualDispenseBody,
  GetDeviceLogsParams,
} from "@meditrack/api-zod";
import bcrypt from "bcryptjs";

import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.use(requireAuth);

function getFunnelStatus(stockCount: number): "ok" | "low" | "empty" | "jam" {
  if (stockCount === 0) return "empty";
  if (stockCount <= 5) return "low";
  return "ok";
}

router.get("/patients/:patientId/devices", async (req, res): Promise<void> => {
  const params = ListDevicesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const devices = await db.select().from(devicesTable)
    .where(eq(devicesTable.patientId, params.data.patientId));
  res.json(devices.map(d => ({
    id: d.id,
    patientId: d.patientId,
    nickname: d.nickname,
    deviceCode: d.deviceCode,
    status: d.status,
    wifiStrength: d.wifiStrength,
    lastSeenAt: d.lastSeenAt,
    createdAt: d.createdAt,
  })));
});

router.post("/patients/:patientId/devices", async (req, res): Promise<void> => {
  const params = PairDeviceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = PairDeviceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [device] = await db.insert(devicesTable).values({
    patientId: params.data.patientId,
    nickname: parsed.data.nickname ?? "MediTrack Dispenser",
    deviceCode: parsed.data.deviceCode,
    status: "online",
    wifiStrength: -65,
    lastSeenAt: new Date(),
  }).returning();

  // Log the pairing event
  await db.insert(deviceLogsTable).values({
    deviceId: device.id,
    event: "online",
    message: "Device paired and connected.",
    funnelNumber: null,
  });

  res.status(201).json({
    id: device.id,
    patientId: device.patientId,
    nickname: device.nickname,
    deviceCode: device.deviceCode,
    status: device.status,
    wifiStrength: device.wifiStrength,
    lastSeenAt: device.lastSeenAt,
    createdAt: device.createdAt,
  });
});

router.get("/patients/:patientId/devices/:deviceId", async (req, res): Promise<void> => {
  const params = GetDeviceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [device] = await db.select().from(devicesTable)
    .where(and(
      eq(devicesTable.id, params.data.deviceId),
      eq(devicesTable.patientId, params.data.patientId),
    )).limit(1);
  if (!device) {
    res.status(404).json({ error: "Device not found." });
    return;
  }

  // Build funnel map from medications
  const meds = await db.select().from(medicationsTable)
    .where(eq(medicationsTable.patientId, params.data.patientId));

  const funnels = Array.from({ length: 8 }, (_, i) => {
    const num = i + 1;
    const med = meds.find(m => m.funnelNumber === num);
    return {
      number: num,
      medicationId: med?.id ?? null,
      medicationName: med?.name ?? null,
      stockCount: med?.stockCount ?? 0,
      status: med ? getFunnelStatus(med.stockCount) : "empty",
    };
  });

  res.json({
    id: device.id,
    patientId: device.patientId,
    nickname: device.nickname,
    deviceCode: device.deviceCode,
    status: device.status,
    wifiStrength: device.wifiStrength,
    lastSeenAt: device.lastSeenAt,
    funnels,
    createdAt: device.createdAt,
  });
});

router.post("/patients/:patientId/devices/:deviceId/dispense", async (req, res): Promise<void> => {
  const params = ManualDispenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = ManualDispenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [patient] = await db.select().from(patientsTable)
    .where(eq(patientsTable.id, params.data.patientId)).limit(1);
  if (!patient) {
    res.status(404).json({ error: "Patient not found." });
    return;
  }
  if (!patient.dispensePinHash) {
    res.status(428).json({ error: "No dispense PIN has been set for this patient yet. Set one in Settings first." });
    return;
  }
  const pinMatches = await bcrypt.compare(parsed.data.pin, patient.dispensePinHash);
  if (!pinMatches) {
    res.status(401).json({ error: "Incorrect PIN. Contact your caregiver if you need help." });
    return;
  }

  const [device] = await db.select().from(devicesTable)
    .where(eq(devicesTable.id, params.data.deviceId)).limit(1);
  if (!device) {
    res.status(404).json({ error: "Device not found." });
    return;
  }
  if (device.status === "offline") {
    res.status(400).json({ error: "Device is offline. Check the Wi-Fi connection and try again." });
    return;
  }

  const [med] = await db.select().from(medicationsTable)
    .where(eq(medicationsTable.id, parsed.data.medicationId)).limit(1);
  if (med && med.stockCount > 0) {
    await db.update(medicationsTable)
      .set({ stockCount: med.stockCount - 1 })
      .where(eq(medicationsTable.id, med.id));
  }

  const dispensedAt = new Date();
  await db.insert(deviceLogsTable).values({
    deviceId: params.data.deviceId,
    event: "dispense",
    message: `Manual dispense: ${med?.name ?? "medication"} (Funnel ${med?.funnelNumber ?? parsed.data.funnelNumber ?? "?"})`,
    funnelNumber: med?.funnelNumber ?? parsed.data.funnelNumber ?? null,
    timestamp: dispensedAt,
  });

  res.json({
    success: true,
    dispensedAt: dispensedAt.toISOString(),
    message: `${med?.name ?? "Medication"} dispensed successfully.`,
  });
});

router.get("/patients/:patientId/devices/:deviceId/logs", async (req, res): Promise<void> => {
  const params = GetDeviceLogsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const logs = await db.select().from(deviceLogsTable)
    .where(eq(deviceLogsTable.deviceId, params.data.deviceId))
    .orderBy(desc(deviceLogsTable.timestamp))
    .limit(50);
  res.json(logs.map(l => ({
    id: l.id,
    deviceId: l.deviceId,
    event: l.event,
    message: l.message,
    funnelNumber: l.funnelNumber,
    timestamp: l.timestamp,
  })));
});

export default router;
