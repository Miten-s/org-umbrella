import { Router } from "express";
import {
  createApplication,
  getApplications,
  getApplicationById,
  updateAppplication,
  enableApplication,
  disableApplication,
  deleteApplication,
  getApplicationGroups
} from "../controllers/gxp-service-applications.controller";
import API_ROUTES from "../utils/routes";

const router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get(API_ROUTES.APPLICATIONS.ROOT, getApplications);

router.get(
  API_ROUTES.APPLICATIONS.GET_APPLICATION_GROUPS,
  getApplicationGroups
);

router.get(API_ROUTES.APPLICATIONS.BY_ID, getApplicationById);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post(API_ROUTES.APPLICATIONS.ROOT, createApplication);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

router.patch(API_ROUTES.APPLICATIONS.BY_ID, updateAppplication);

router.post(API_ROUTES.APPLICATIONS.ENABLE_BY_ID, enableApplication);

router.post(API_ROUTES.APPLICATIONS.DISABLE_BY_ID, disableApplication);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

router.delete(API_ROUTES.APPLICATIONS.BY_ID, deleteApplication);

export default router;
