import { eq, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import {
  pool,
  db,
  usersTable,
  patientsTable,
  patientCaregiversTable,
  medicationsTable,
  schedulesTable,
  doseEventsTable,
  devicesTable,
  deviceLogsTable,
  notificationSettingsTable,
} from "@meditrack/db";

const DEMO_PATIENT = "Lola Carmen Santos";
const DEMO_PIN = "1234";
const ALL_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const MEDS = [
  { name: "Losartan", generic: "Losartan potassium", dosage: "50mg", form: "tablet", funnel: 1, stock: 24, cap: 30, color: "#2563eb", note: "Take in the morning, with water.", times: ["08:00"] },
  { name: "Metformin", generic: "Metformin HCl", dosage: "500mg", form: "tablet", funnel: 2, stock: 4, cap: 60, color: "#f59e0b", note: "Take with food to reduce stomach upset.", times: ["08:00", "20:00"] },
  { name: "Amlodipine", generic: "Amlodipine besylate", dosage: "5mg", form: "tablet", funnel: 3, stock: 21, cap: 30, color: "#10b981", note: "Once daily, same time each day.", times: ["13:00"] },
  { name: "Atorvastatin", generic: "Atorvastatin calcium", dosage: "20mg", form: "tablet", funnel: 4, stock: 17, cap: 30, color: "#8b5cf6", note: "Take in the evening.", times: ["20:00"] },
];

async function main() {
  const email = process.argv[2]?.trim();
  if (!email) {
    console.error("Usage: npx tsx apps/api/src/seed.ts <account-email>");
    process.exit(1);
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    console.error(`No account found for "${email}". Sign up first, then run this again.`);
    process.exit(1);
  }

  // Remove a previous demo patient (and everything hanging off it).
  const old = await db.select().from(patientsTable);
  const oldIds = old.filter((p) => p.ownerId === user.id && p.name === DEMO_PATIENT).map((p) => p.id);
  if (oldIds.length) {
    const devs = await db.select().from(devicesTable).where(inArray(devicesTable.patientId, oldIds));
    if (devs.length) await db.delete(deviceLogsTable).where(inArray(deviceLogsTable.deviceId, devs.map((d) => d.id)));
    await db.delete(devicesTable).where(inArray(devicesTable.patientId, oldIds));
    await db.delete(doseEventsTable).where(inArray(doseEventsTable.patientId, oldIds));
    await db.delete(schedulesTable).where(inArray(schedulesTable.patientId, oldIds));
    await db.delete(medicationsTable).where(inArray(medicationsTable.patientId, oldIds));
    await db.delete(notificationSettingsTable).where(inArray(notificationSettingsTable.patientId, oldIds));
    await db.delete(patientCaregiversTable).where(inArray(patientCaregiversTable.patientId, oldIds));
    await db.delete(patientsTable).where(inArray(patientsTable.id, oldIds));
    console.log("Replaced previous demo patient.");
  }

  const [patient] = await db.insert(patientsTable).values({
    ownerId: user.id,
    name: DEMO_PATIENT,
    dateOfBirth: "1948-03-14",
    bloodType: "O+",
    conditions: JSON.stringify(["Hypertension", "Type 2 Diabetes", "High Cholesterol"]),
    allergies: JSON.stringify(["Penicillin", "Shellfish"]),
    emergencyContactName: "Maria Santos",
    emergencyContactPhone: "+63 917 123 4567",
    emergencyToken: randomBytes(16).toString("hex"),
    preferredLanguage: "en",
    dispensePinHash: await bcrypt.hash(DEMO_PIN, 12),
  }).returning();

  await db.insert(notificationSettingsTable).values({ patientId: patient.id });

  // Medications + schedules
  const schedules: { medId: number; time: string }[] = [];
  for (const m of MEDS) {
    const [med] = await db.insert(medicationsTable).values({
      patientId: patient.id,
      name: m.name,
      genericName: m.generic,
      dosage: m.dosage,
      form: m.form,
      funnelNumber: m.funnel,
      stockCount: m.stock,
      stockCapacity: m.cap,
      instructions: m.note,
      color: m.color,
    }).returning();
    for (const time of m.times) {
      await db.insert(schedulesTable).values({
        medicationId: med.id,
        patientId: patient.id,
        timeType: "clock",
        clockTime: time,
        daysOfWeek: JSON.stringify(ALL_DAYS),
      });
      schedules.push({ medId: med.id, time });
    }
  }

  // 14 days of history (yesterday and earlier).
  const events: (typeof doseEventsTable.$inferInsert)[] = [];
  for (let d = 14; d >= 1; d--) {
    schedules.forEach((s, i) => {
      const [hh, mm] = s.time.split(":").map(Number);
      const at = new Date();
      at.setDate(at.getDate() - d);
      at.setHours(hh, mm, 0, 0);

      const dow = at.getDay();
      // Metformin's evening dose slips on weekends -> triggers the trend flag.
      const weekendEvening = (dow === 0 || dow === 6) && s.time === "20:00" && i === 2;
      const randomMiss = (d * 7 + i * 3) % 23 === 0;
      const missed = weekendEvening || randomMiss;

      events.push({
        patientId: patient.id,
        medicationId: s.medId,
        scheduledAt: at,
        status: missed ? "missed" : "taken",
        confirmedAt: missed ? null : new Date(at.getTime() + ((d + i) % 9) * 60000 + 60000),
        method: missed ? null : (["tap", "tap", "voice", "auto"] as const)[(d + i) % 4],
      });
    });
  }
  await db.insert(doseEventsTable).values(events);

  // Paired device + activity log
  const [device] = await db.insert(devicesTable).values({
    patientId: patient.id,
    nickname: "Kitchen Dispenser",
    deviceCode: `MT-DEMO-${randomBytes(2).toString("hex").toUpperCase()}`,
    status: "online",
    wifiStrength: 82,
    lastSeenAt: new Date(),
  }).returning();

  const ago = (h: number) => new Date(Date.now() - h * 3600_000);
  await db.insert(deviceLogsTable).values([
    { deviceId: device.id, event: "online", message: "Dispenser connected to Wi-Fi", timestamp: ago(30) },
    { deviceId: device.id, event: "dispense", message: "Dispensed Losartan 50mg", funnelNumber: 1, timestamp: ago(26) },
    { deviceId: device.id, event: "dispense", message: "Dispensed Metformin 500mg", funnelNumber: 2, timestamp: ago(26) },
    { deviceId: device.id, event: "refill", message: "Funnel 3 refilled (21 tablets)", funnelNumber: 3, timestamp: ago(20) },
    { deviceId: device.id, event: "missed", message: "Metformin 500mg dose was not taken", funnelNumber: 2, timestamp: ago(12) },
    { deviceId: device.id, event: "dispense", message: "Dispensed Atorvastatin 20mg", funnelNumber: 4, timestamp: ago(4) },
  ]);

  console.log(`\nSeeded demo data for ${email}:`);
  console.log(`  Patient : ${DEMO_PATIENT}`);
  console.log(`  Meds    : ${MEDS.map((m) => m.name).join(", ")}`);
  console.log(`  History : ${events.length} dose events (last 14 days)`);
  console.log(`  Device  : ${device.nickname} (${device.deviceCode})`);
  console.log(`  Dispense PIN: ${DEMO_PIN}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());