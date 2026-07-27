import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import patientsRouter from "./patients";
import medicationsRouter from "./medications";
import devicesRouter from "./devices";
import adherenceRouter from "./adherence";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(patientsRouter);
router.use(medicationsRouter);
router.use(devicesRouter);
router.use(adherenceRouter);
router.use(dashboardRouter);

export default router;
