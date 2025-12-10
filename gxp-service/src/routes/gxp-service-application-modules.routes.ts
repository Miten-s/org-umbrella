import { Router } from "express";
import {
  createApplicationModule,
  getApplicationModules,
  getApplicationModuleById,
  updateAppplicationModule,
  updateApplicationModuleStatus,
  deleteApplicationModule
} from "../controllers/gxp-service-application-modules.controller";
import API_ROUTES from "../utils/routes";

const router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get(API_ROUTES.APPLICATION_MODULES.ROOT, getApplicationModules);

router.get(API_ROUTES.APPLICATION_MODULES.BY_ID, getApplicationModuleById);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post(API_ROUTES.APPLICATION_MODULES.ROOT, createApplicationModule);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

router.patch(
  API_ROUTES.APPLICATION_MODULES.BY_ID,
  updateApplicationModuleStatus
);

router.post(
  API_ROUTES.APPLICATION_MODULES.STATUS_BY_ID,
  updateAppplicationModule
);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

router.delete(API_ROUTES.APPLICATIONS.BY_ID, deleteApplicationModule);

export default router;
