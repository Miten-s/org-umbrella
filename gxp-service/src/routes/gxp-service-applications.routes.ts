import { Router } from "express";
import {
  createApplication,
  getApplications,
  getApplicationById,
  updateAppplication,
  enableApplication,
  disableApplication,
  deleteApplication,
  getApplicationGroups,
  deleteAttachments,
  duplicateApplication
} from "../controllers/gxp-service-applications.controller";
import API_ROUTES from "../utils/routes";
import upload from "../middlewares/multer.middleware.js";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateApplicationDto, UpdateApplicationDto } from "../dtos/application.dto";

const router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get(API_ROUTES.APPLICATIONS.ROOT, getApplications);

router.get(
  API_ROUTES.APPLICATIONS.GET_APPLICATION_GROUPS,
  getApplicationGroups
);

router.get(API_ROUTES.APPLICATIONS.BY_ID, getApplicationById);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post(
  API_ROUTES.APPLICATIONS.ROOT,
  upload.array("attachments"),
  validateDto(CreateApplicationDto),
  createApplication
);

router.post(
  API_ROUTES.APPLICATIONS.DUPLICATE_BY_ID,
  duplicateApplication
);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

router.post(API_ROUTES.APPLICATIONS.ENABLE_BY_ID, enableApplication);

router.post(API_ROUTES.APPLICATIONS.DISABLE_BY_ID, disableApplication);

router.patch(
  API_ROUTES.APPLICATIONS.BY_ID,
  upload.array("attachments"),
  validateDto(UpdateApplicationDto),
  updateAppplication
);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

router.delete(API_ROUTES.APPLICATIONS.DELETE_ATTACHMENTS, deleteAttachments);

router.delete(API_ROUTES.APPLICATIONS.BY_ID, deleteApplication);

export default router;
