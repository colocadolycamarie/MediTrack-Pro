import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import patientsRouter from "./patients";
import medicationsRouter from "./medications";
import devicesRouter from "./devices";
import adherenceRouter from "./adherence";
import dashboardRouter from "./dashboard";
import privacyRouter from "./privacy";
import { requireAuth } from "../middlewares/requireAuth";
import { requirePatientAccess } from "../middlewares/requirePatientAccess";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(privacyRouter);

// One gate for every patient-scoped route: you must be logged in AND be the
// owner / a linked caregiver of the :patientId in the URL.
router.use("/patients/:patientId", requireAuth, requirePatientAccess);
router.use(patientsRouter);
router.use(medicationsRouter);
router.use(devicesRouter);
router.use(adherenceRouter);
router.use(dashboardRouter);

export default router;
