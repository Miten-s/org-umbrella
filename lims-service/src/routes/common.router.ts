import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import API_ROUTES from "../utils/routes";
import permissionRoutes from "./permission.routes";
import groupRoutes from "./group.routes";
import roleRoutes from "./role.routes";
import limsUserRoutes from "./lims-user.routes";
import phraseRoutes from "./phrase.routes";
import locationRoutes from "./location.routes";
import attachmentRoutes from "./attachment.routes";
import customerRoutes from "./customer.routes";
import supplierRoutes from "./supplier.routes";
import projectRoutes from "./project.routes";
import studyRoutes from "./study.routes";
import parameterRoutes from "./parameter.routes";
import stockRoutes from "./stock.routes";
import stockBatchRoutes from "./stock-batch.routes";
import aliquotRoutes from "./aliquot.routes";
import instrumentRoutes from "./instrument.routes";
import instrumentPartRoutes from "./instrument-part.routes";
import calibrationRoutes from "./calibration.routes";
import inspectionPlanRoutes from "./inspection-plan.routes";
import analysisRoutes from "./analysis.routes";
import testGroupRoutes from "./test-group.routes";
import specificationRoutes from "./specification.routes";
import batchRoutes from "./batch.routes";
import lotRoutes from "./lot.routes";
import sampleRoutes from "./sample.routes";
import testRoutes from "./test.routes";
import resultRoutes from "./result.routes";
import schedulerRoutes from "./scheduler.routes";

const commonRouter: Router = Router();

// All routes require authentication (spec NFR-1); each entity router additionally
// carries `authorize(entity, action)`, which is what actually grants access.
commonRouter.use(authenticate);

commonRouter.use(API_ROUTES.PERMISSIONS, permissionRoutes);
// Files for every entity; permission is checked against the parent record.
commonRouter.use(API_ROUTES.ATTACHMENTS, attachmentRoutes);

// ─── Administration ─────────────────────────────────────────────────────────
commonRouter.use(API_ROUTES.GROUPS, groupRoutes);
commonRouter.use(API_ROUTES.ROLES, roleRoutes);
commonRouter.use(API_ROUTES.LIMS_USERS, limsUserRoutes);

// ─── Master Data ────────────────────────────────────────────────────────────
commonRouter.use(API_ROUTES.PHRASES, phraseRoutes);
commonRouter.use(API_ROUTES.LOCATIONS, locationRoutes);
commonRouter.use(API_ROUTES.CUSTOMERS, customerRoutes);
commonRouter.use(API_ROUTES.SUPPLIERS, supplierRoutes);
commonRouter.use(API_ROUTES.PROJECTS, projectRoutes);
commonRouter.use(API_ROUTES.STUDIES, studyRoutes);
commonRouter.use(API_ROUTES.PARAMETERS, parameterRoutes);
commonRouter.use(API_ROUTES.STOCK, stockRoutes);
commonRouter.use(API_ROUTES.STOCK_BATCHES, stockBatchRoutes);
commonRouter.use(API_ROUTES.ALIQUOTS, aliquotRoutes);
commonRouter.use(API_ROUTES.INSTRUMENTS, instrumentRoutes);
commonRouter.use(API_ROUTES.INSTRUMENT_PARTS, instrumentPartRoutes);
commonRouter.use(API_ROUTES.CALIBRATIONS, calibrationRoutes);
commonRouter.use(API_ROUTES.INSPECTION_PLANS, inspectionPlanRoutes);
commonRouter.use(API_ROUTES.ANALYSES, analysisRoutes);
commonRouter.use(API_ROUTES.TEST_GROUPS, testGroupRoutes);
commonRouter.use(API_ROUTES.SPECIFICATIONS, specificationRoutes);

// ─── Lab Executions ─────────────────────────────────────────────────────────
commonRouter.use(API_ROUTES.BATCHES, batchRoutes);
commonRouter.use(API_ROUTES.LOTS, lotRoutes);
commonRouter.use(API_ROUTES.SAMPLES, sampleRoutes);
commonRouter.use(API_ROUTES.TESTS, testRoutes);
commonRouter.use(API_ROUTES.RESULTS, resultRoutes);
commonRouter.use(API_ROUTES.SCHEDULERS, schedulerRoutes);

// Remaining entity routers are mounted here as each one is built.

export default commonRouter;
