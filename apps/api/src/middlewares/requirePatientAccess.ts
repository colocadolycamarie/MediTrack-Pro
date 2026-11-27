import type { NextFunction, Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { db, patientsTable, patientCaregiversTable } from "@dosemate/db";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Set by requirePatientAccess: the caller's relationship to the patient in the URL. */
      patientRole?: "owner" | "caregiver";
    }
  }
}

const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Mounted once in routes/index.ts on `/patients/:patientId`, so it covers every
 * patient-scoped route (medications, schedules, devices, adherence, dashboard,
 * caregivers...) in one place instead of relying on each handler to remember.
 *
 * - Must run after requireAuth (needs req.userId).
 * - The owner of the patient record can do everything.
 * - A linked caregiver can read; they can only change things when their link
 *   has accessLevel "full". A "view" caregiver is read-only.
 * - Someone with no link gets the same 404 as a patient that doesn't exist, so
 *   the API doesn't reveal which patient ids are real.
 */
export async function requirePatientAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  const raw = req.params["patientId"];
  const patientId = parseInt(Array.isArray(raw) ? raw[0] : (raw as string), 10);
  if (!Number.isInteger(patientId) || patientId <= 0) {
    res.status(400).json({ error: "Invalid patient id." });
    return;
  }

  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: "Authentication required. Sign in and try again." });
    return;
  }

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, patientId)).limit(1);
  if (!patient) {
    res.status(404).json({ error: "Patient not found." });
    return;
  }

  if (patient.ownerId === userId) {
    req.patientRole = "owner";
    next();
    return;
  }

  const [link] = await db.select().from(patientCaregiversTable).where(
    and(eq(patientCaregiversTable.patientId, patientId), eq(patientCaregiversTable.caregiverId, userId)),
  ).limit(1);

  if (!link) {
    res.status(404).json({ error: "Patient not found." });
    return;
  }

  if (!READ_METHODS.has(req.method) && link.accessLevel !== "full") {
    res.status(403).json({ error: "You have view-only access to this patient. Ask the owner for full access to make changes." });
    return;
  }

  req.patientRole = "caregiver";
  next();
}
