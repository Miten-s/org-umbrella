import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import auditRoutes from "./audit.routes";
import phraseRoutes from "./phrase.routes";
import customerRoutes from "./customer.routes";
import supplierRoutes from "./supplier.routes";
import projectRoutes from "./project.routes";
import studyRoutes from "./study.routes";
import locationRoutes from "./location.routes";
import stockParameterRoutes from "./stock-parameter.routes";
import stockRoutes from "./stock.routes";
import stockBatchRoutes from "./stock-batch.routes";
import aliquotRoutes from "./aliquot.routes";
import instrumentRoutes from "./instrument.routes";
import instrumentPartRoutes from "./instrument-part.routes";
import calibrationScheduleRoutes from "./calibration-schedule.routes";
import calibrationRoutes from "./calibration.routes";
import inspectionPlanRoutes from "./inspection-plan.routes";
import inspectionPersonnelRoutes from "./inspection-personnel.routes";
import analysisRoutes from "./analysis.routes";
import analysisComponentRoutes from "./analysis-component.routes";
import testGroupRoutes from "./test-group.routes";
import testGroupItemRoutes from "./test-group-item.routes";
import specificationRoutes from "./specification.routes";
import specLimitRoutes from "./spec-limit.routes";
import batchRoutes from "./batch.routes";
import lotRoutes from "./lot.routes";
import sampleRoutes from "./sample.routes";
import testRoutes from "./test.routes";
import testWindowRoutes from "./test-window.routes";
import resultRoutes from "./result.routes";
import API_ROUTES from "../utils/routes";

const commonRouter: Router = Router();

// LIMS Users - skip auth to allow syncing from backend (if needed later)
// commonRouter.use(API_ROUTES.LIMS_USERS, limsUserRouter);

// All other routes require authentication
commonRouter.use(authenticate);

// Feature Routes
commonRouter.use(API_ROUTES.PHRASES, phraseRoutes);
commonRouter.use(API_ROUTES.CUSTOMERS, customerRoutes);
commonRouter.use(API_ROUTES.SUPPLIERS, supplierRoutes);
commonRouter.use(API_ROUTES.PROJECTS, projectRoutes);
commonRouter.use(API_ROUTES.STUDIES, studyRoutes);
commonRouter.use(API_ROUTES.LOCATIONS, locationRoutes);
commonRouter.use(API_ROUTES.STOCK_PARAMETERS, stockParameterRoutes);
commonRouter.use(API_ROUTES.STOCK, stockRoutes);
commonRouter.use(API_ROUTES.STOCK_BATCHES, stockBatchRoutes);
commonRouter.use(API_ROUTES.ALIQUOTS, aliquotRoutes);
commonRouter.use(API_ROUTES.INSTRUMENTS, instrumentRoutes);
commonRouter.use(API_ROUTES.INSTRUMENT_PARTS, instrumentPartRoutes);
commonRouter.use(API_ROUTES.CALIBRATION_SCHEDULES, calibrationScheduleRoutes);
commonRouter.use(API_ROUTES.CALIBRATIONS, calibrationRoutes);
commonRouter.use(API_ROUTES.INSPECTION_PLANS, inspectionPlanRoutes);
commonRouter.use(API_ROUTES.INSPECTION_PERSONNEL, inspectionPersonnelRoutes);
commonRouter.use(API_ROUTES.ANALYSES, analysisRoutes);
commonRouter.use(API_ROUTES.ANALYSIS_COMPONENTS, analysisComponentRoutes);
commonRouter.use(API_ROUTES.TEST_GROUPS, testGroupRoutes);
commonRouter.use(API_ROUTES.TEST_GROUP_ITEMS, testGroupItemRoutes);
commonRouter.use(API_ROUTES.SPECIFICATIONS, specificationRoutes);
commonRouter.use(API_ROUTES.SPEC_LIMITS, specLimitRoutes);
commonRouter.use(API_ROUTES.BATCHES, batchRoutes);
commonRouter.use(API_ROUTES.LOTS, lotRoutes);
commonRouter.use(API_ROUTES.SAMPLES, sampleRoutes);
commonRouter.use(API_ROUTES.TESTS, testRoutes);
commonRouter.use(API_ROUTES.TEST_WINDOWS, testWindowRoutes);
commonRouter.use(API_ROUTES.RESULTS, resultRoutes);

// Audit Trail routes
commonRouter.use(API_ROUTES.AUDIT, auditRoutes);

export default commonRouter;
