import { eq, inArray } from "drizzle-orm";
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

const TO_REMOVE = ["rebecca colocado", "louie colocado"];

async function main() {
  const email = process.argv[2]?.trim();
  if (!email) {
    console.error("Usage: npx tsx apps/api/src/remove-patients.ts <account-email>");
    process.exit(1);
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    console.error(`No account found for "${email}".`);
    process.exit(1);
  }

  const all = await db.select().from(patientsTable);
  const matches = all.filter((p) => TO_REMOVE.includes(p.name.trim().toLowerCase()));
  const mine = matches.filter((p) => p.ownerId === user.id);

  if (!mine.length) {
    console.log("No matching patients owned by this account.");
    console.log("Patients found by that name (any owner):", matches.map((p) => `${p.name} (id ${p.id}, owner ${p.ownerId})`));
    console.log("Your user id:", user.id);
    return;
  }

  const ids = mine.map((p) => p.id);
  const devs = await db.select().from(devicesTable).where(inArray(devicesTable.patientId, ids));
  if (devs.length) await db.delete(deviceLogsTable).where(inArray(deviceLogsTable.deviceId, devs.map((d) => d.id)));
  await db.delete(devicesTable).where(inArray(devicesTable.patientId, ids));
  await db.delete(doseEventsTable).where(inArray(doseEventsTable.patientId, ids));
  await db.delete(schedulesTable).where(inArray(schedulesTable.patientId, ids));
  await db.delete(medicationsTable).where(inArray(medicationsTable.patientId, ids));
  await db.delete(notificationSettingsTable).where(inArray(notificationSettingsTable.patientId, ids));
  await db.delete(patientCaregiversTable).where(inArray(patientCaregiversTable.patientId, ids));
  await db.delete(patientsTable).where(inArray(patientsTable.id, ids));

  console.log("Removed:", mine.map((p) => p.name).join(", "));
}

main()
  .catch((e) => {
    console.error("Failed:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());