import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  db,
  usersTable,
  patientsTable,
  patientCaregiversTable,
  medicationsTable,
  schedulesTable,
  doseEventsTable,
  notificationSettingsTable,
  devicesTable,
  deviceLogsTable,
} from "@dosemate/db";
import { requireAuth } from "../middlewares/requireAuth";
import { rateLimit } from "../middlewares/security";
import { destroyAllSessionsForUser } from "./auth";

/**
 * Data-subject rights (access/portability and erasure) under the Philippine
 * Data Privacy Act of 2012 (RA 10173). Both routes only ever touch the
 * signed-in user's own data, and neither changes the database schema.
 */
const router: IRouter = Router();

const sensitiveLimiter = rateLimit({
  name: "privacy",
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many requests. Please wait a few minutes and try again.",
});

/** Everything the user owns, grouped by patient. Password and PIN hashes are never included. */
router.get("/privacy/export", requireAuth, sensitiveLimiter, async (req, res): Promise<void> => {
  const userId = req.userId!;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "Account not found." });
    return;
  }

  const owned = await db.select().from(patientsTable).where(eq(patientsTable.ownerId, userId));
  const patients = [];
  for (const p of owned) {
    const meds = await db.select().from(medicationsTable).where(eq(medicationsTable.patientId, p.id));
    const schedules = await db.select().from(schedulesTable).where(eq(schedulesTable.patientId, p.id));
    const doseEvents = await db.select().from(doseEventsTable).where(eq(doseEventsTable.patientId, p.id));
    const [notificationSettings] = await db.select().from(notificationSettingsTable)
      .where(eq(notificationSettingsTable.patientId, p.id)).limit(1);
    const devices = await db.select().from(devicesTable).where(eq(devicesTable.patientId, p.id));
    const deviceIds = devices.map(d => d.id);
    const deviceLogs = deviceIds.length
      ? await db.select().from(deviceLogsTable).where(inArray(deviceLogsTable.deviceId, deviceIds))
      : [];
    const links = await db.select().from(patientCaregiversTable).where(eq(patientCaregiversTable.patientId, p.id));

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { dispensePinHash, ...patient } = p;
    patients.push({
      patient: { ...patient, hasDispensePin: Boolean(dispensePinHash) },
      medications: meds,
      schedules,
      doseEvents,
      notificationSettings: notificationSettings ?? null,
      devices,
      deviceLogs,
      caregiverAccess: links.map(l => ({ caregiverId: l.caregiverId, accessLevel: l.accessLevel, status: l.status, createdAt: l.createdAt })),
    });
  }

  const sharedWithMe = await db.select().from(patientCaregiversTable).where(eq(patientCaregiversTable.caregiverId, userId));

  const filename = `dosemate-my-data-${new Date().toISOString().slice(0, 10)}.json`;
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.json({
    exportedAt: new Date().toISOString(),
    account: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
    patients,
    caregiverLinksToOtherPatients: sharedWithMe.map(l => ({
      patientId: l.patientId, accessLevel: l.accessLevel, status: l.status, createdAt: l.createdAt,
    })),
  });
});

/**
 * Permanently deletes the account and every patient record the user OWNS
 * (with its medications, schedules, dose history, devices and logs).
 * Requires the account password and the literal confirmation word, because it cannot be undone.
 * All deletes run in one transaction: either everything is removed or nothing is.
 */
router.post("/privacy/delete-account", requireAuth, sensitiveLimiter, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const body = (req.body ?? {}) as { password?: unknown; confirm?: unknown };

  if (typeof body.password !== "string" || body.password.length === 0) {
    res.status(400).json({ error: "Enter your password to confirm." });
    return;
  }
  if (body.confirm !== "DELETE") {
    res.status(400).json({ error: 'Type DELETE to confirm.' });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "Account not found." });
    return;
  }
  if (!(await bcrypt.compare(body.password, user.passwordHash))) {
    res.status(401).json({ error: "Incorrect password." });
    return;
  }

  await db.transaction(async (tx) => {
    const owned = await tx.select().from(patientsTable).where(eq(patientsTable.ownerId, userId));
    const patientIds = owned.map(p => p.id);

    let invitedUserIds: number[] = [];
    if (patientIds.length) {
      const devices = await tx.select().from(devicesTable).where(inArray(devicesTable.patientId, patientIds));
      const deviceIds = devices.map(d => d.id);
      if (deviceIds.length) await tx.delete(deviceLogsTable).where(inArray(deviceLogsTable.deviceId, deviceIds));
      await tx.delete(devicesTable).where(inArray(devicesTable.patientId, patientIds));
      await tx.delete(doseEventsTable).where(inArray(doseEventsTable.patientId, patientIds));
      await tx.delete(schedulesTable).where(inArray(schedulesTable.patientId, patientIds));
      await tx.delete(medicationsTable).where(inArray(medicationsTable.patientId, patientIds));
      await tx.delete(notificationSettingsTable).where(inArray(notificationSettingsTable.patientId, patientIds));

      const links = await tx.select().from(patientCaregiversTable).where(inArray(patientCaregiversTable.patientId, patientIds));
      invitedUserIds = links.map(l => l.caregiverId).filter(id => id !== userId);
      await tx.delete(patientCaregiversTable).where(inArray(patientCaregiversTable.patientId, patientIds));
      await tx.delete(patientsTable).where(inArray(patientsTable.id, patientIds));
    }

    // Links where this user was a caregiver on someone else's patient.
    await tx.delete(patientCaregiversTable).where(eq(patientCaregiversTable.caregiverId, userId));

    // Invitations create a placeholder account (password "placeholder") holding just an email
    // address. Remove those placeholders if nothing else uses them, so we don't keep strangers' emails.
    if (invitedUserIds.length) {
      const candidates = await tx.select().from(usersTable).where(inArray(usersTable.id, invitedUserIds));
      for (const c of candidates) {
        if (c.passwordHash !== "placeholder") continue;
        const stillLinked = await tx.select().from(patientCaregiversTable).where(eq(patientCaregiversTable.caregiverId, c.id)).limit(1);
        const stillOwns = await tx.select().from(patientsTable).where(eq(patientsTable.ownerId, c.id)).limit(1);
        if (stillLinked.length === 0 && stillOwns.length === 0) {
          await tx.delete(usersTable).where(eq(usersTable.id, c.id));
        }
      }
    }

    await tx.delete(usersTable).where(eq(usersTable.id, userId));
  });

  destroyAllSessionsForUser(userId);
  req.log?.info({ userId }, "Account deleted at the user's request");
  res.json({ success: true, message: "Your account and data have been deleted." });
});

export default router;
