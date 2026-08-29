import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, patientsTable, patientCaregiversTable, usersTable } from "@meditrack/db";
import {
  CreatePatientBody,
  UpdatePatientBody,
  GetPatientParams,
  UpdatePatientParams,
  SetDispensePinBody,
  SetDispensePinParams,
  InviteCaregiverParams,
  InviteCaregiverBody,
  RemoveCaregiverParams,
  ListPatientCaregiversParams,
} from "@meditrack/api-zod";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.use(requireAuth);

// Same work factor as user password hashing (see auth.ts) — a caregiver PIN
// gates a real-world action (dispensing medication), so it deserves the same
// slow, salted hashing as an account password rather than plaintext storage.
const BCRYPT_COST = 12;

/** True if `userId` owns the patient record or is an accepted caregiver on it. */
export async function canAccessPatient(userId: number, patientId: number): Promise<boolean> {
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, patientId)).limit(1);
  if (!patient) return false;
  if (patient.ownerId === userId) return true;

  const [link] = await db.select().from(patientCaregiversTable).where(
    and(eq(patientCaregiversTable.patientId, patientId), eq(patientCaregiversTable.caregiverId, userId)),
  ).limit(1);
  return Boolean(link);
}

function parseParam(val: string | string[]): number {
  const raw = Array.isArray(val) ? val[0] : val;
  return parseInt(raw, 10);
}

function serializePatient(p: typeof patientsTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    dateOfBirth: p.dateOfBirth,
    bloodType: p.bloodType,
    conditions: JSON.parse(p.conditions || "[]"),
    allergies: JSON.parse(p.allergies || "[]"),
    emergencyContactName: p.emergencyContactName,
    emergencyContactPhone: p.emergencyContactPhone,
    emergencyToken: p.emergencyToken,
    preferredLanguage: p.preferredLanguage,
    hasDispensePin: Boolean(p.dispensePinHash),
    createdAt: p.createdAt,
  };
}

router.get("/patients", async (req, res): Promise<void> => {
  const userId = req.userId!;

  const owned = await db.select().from(patientsTable).where(eq(patientsTable.ownerId, userId));
  const links = await db.select().from(patientCaregiversTable).where(eq(patientCaregiversTable.caregiverId, userId));
  const linkedIds = links.map((l) => l.patientId).filter((id) => !owned.some((p) => p.id === id));

  const linked = linkedIds.length
    ? await Promise.all(linkedIds.map(async (id) => {
        const [p] = await db.select().from(patientsTable).where(eq(patientsTable.id, id)).limit(1);
        return p;
      }))
    : [];

  const patients = [...owned, ...linked.filter((p): p is typeof owned[number] => Boolean(p))]
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  res.json(patients.map(serializePatient));
});

router.post("/patients", async (req, res): Promise<void> => {
  const parsed = CreatePatientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { conditions, allergies, preferredLanguage, dateOfBirth, ...rest } = parsed.data;
  const emergencyToken = randomBytes(16).toString("hex");

  const [patient] = await db.insert(patientsTable).values({
    ...rest,
    dateOfBirth: dateOfBirth.toISOString().slice(0, 10),
    ownerId: req.userId!,
    conditions: JSON.stringify(conditions ?? []),
    allergies: JSON.stringify(allergies ?? []),
    preferredLanguage: preferredLanguage ?? "en",
    emergencyToken,
  }).returning();

  res.status(201).json(serializePatient(patient));
});

router.get("/patients/:patientId", async (req, res): Promise<void> => {
  const params = GetPatientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  if (!(await canAccessPatient(req.userId!, params.data.patientId))) {
    res.status(404).json({ error: "Patient not found." });
    return;
  }

  const [patient] = await db.select().from(patientsTable)
    .where(eq(patientsTable.id, params.data.patientId)).limit(1);

  if (!patient) {
    res.status(404).json({ error: "Patient not found." });
    return;
  }

  res.json(serializePatient(patient));
});

router.patch("/patients/:patientId", async (req, res): Promise<void> => {
  const params = UpdatePatientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  if (!(await canAccessPatient(req.userId!, params.data.patientId))) {
    res.status(404).json({ error: "Patient not found." });
    return;
  }

  const parsed = UpdatePatientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { conditions, allergies, dateOfBirth, ...rest } = parsed.data;
  const updateData: Record<string, unknown> = { ...rest };
  if (conditions !== undefined) updateData.conditions = JSON.stringify(conditions);
  if (allergies !== undefined) updateData.allergies = JSON.stringify(allergies);
  if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth.toISOString().slice(0, 10);

  const [patient] = await db.update(patientsTable)
    .set(updateData)
    .where(eq(patientsTable.id, params.data.patientId))
    .returning();

  if (!patient) {
    res.status(404).json({ error: "Patient not found." });
    return;
  }

  res.json(serializePatient(patient));
});

router.put("/patients/:patientId/dispense-pin", async (req, res): Promise<void> => {
  const params = SetDispensePinParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  if (!(await canAccessPatient(req.userId!, params.data.patientId))) {
    res.status(404).json({ error: "Patient not found." });
    return;
  }

  const parsed = SetDispensePinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const dispensePinHash = await bcrypt.hash(parsed.data.pin, BCRYPT_COST);

  const [patient] = await db.update(patientsTable)
    .set({ dispensePinHash })
    .where(eq(patientsTable.id, params.data.patientId))
    .returning();

  if (!patient) {
    res.status(404).json({ error: "Patient not found." });
    return;
  }

  res.json(serializePatient(patient));
});

// Caregivers
router.get("/patients/:patientId/caregivers", async (req, res): Promise<void> => {
  const params = ListPatientCaregiversParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const links = await db.select().from(patientCaregiversTable)
    .where(eq(patientCaregiversTable.patientId, params.data.patientId));

  const result = await Promise.all(links.map(async (link) => {
    const [caregiver] = await db.select().from(usersTable)
      .where(eq(usersTable.id, link.caregiverId)).limit(1);
    return {
      id: link.id,
      caregiverId: link.caregiverId,
      patientId: link.patientId,
      caregiverName: caregiver?.name ?? "Unknown",
      caregiverEmail: caregiver?.email ?? "",
      accessLevel: link.accessLevel,
      status: link.status,
      createdAt: link.createdAt,
    };
  }));

  res.json(result);
});

router.post("/patients/:patientId/caregivers", async (req, res): Promise<void> => {
  const params = InviteCaregiverParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = InviteCaregiverBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Find user by email or create a placeholder
  let [caregiver] = await db.select().from(usersTable)
    .where(eq(usersTable.email, parsed.data.email)).limit(1);

  if (!caregiver) {
    [caregiver] = await db.insert(usersTable).values({
      name: parsed.data.email.split("@")[0],
      email: parsed.data.email,
      passwordHash: "placeholder",
      role: "caregiver",
    }).returning();
  }

  const [link] = await db.insert(patientCaregiversTable).values({
    patientId: params.data.patientId,
    caregiverId: caregiver.id,
    accessLevel: parsed.data.accessLevel,
    status: "pending",
  }).returning();

  res.status(201).json({
    id: link.id,
    caregiverId: link.caregiverId,
    patientId: link.patientId,
    caregiverName: caregiver.name,
    caregiverEmail: caregiver.email,
    accessLevel: link.accessLevel,
    status: link.status,
    createdAt: link.createdAt,
  });
});

router.delete("/patients/:patientId/caregivers/:caregiverId", async (req, res): Promise<void> => {
  const params = RemoveCaregiverParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(patientCaregiversTable).where(
    and(
      eq(patientCaregiversTable.patientId, params.data.patientId),
      eq(patientCaregiversTable.caregiverId, params.data.caregiverId),
    )
  );

  res.json({ success: true, message: "Caregiver removed." });
});

export default router;
