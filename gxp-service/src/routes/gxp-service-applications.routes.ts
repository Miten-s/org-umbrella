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
  duplicateApplication,
  getApplicationRoles,
  bulkDeleteApplications,
  bulkDuplicateApplications,
  bulkCopyApplications,
  bulkUpdateApplications,
  bulkRestoreApplications
} from "../controllers/gxp-service-applications.controller";
import API_ROUTES from "../utils/routes";
import upload from "../middlewares/multer.middleware.js";
import {
  validateDto,
  validateDtoArray
} from "../middlewares/validate-dto.middleware";
import {
  CreateApplicationDto,
  UpdateApplicationDto
} from "../dtos/application.dto";
import {
  BulkCreateDto,
  BulkUpdateDto,
  BulkOperationDto
} from "../dtos/common.dto";
import { authorize } from "../middlewares/authorize.middleware";

const router = Router();
const can = (action: "VIEW" | "CREATE" | "UPDATE" | "DELETE") =>
  authorize("APPLICATION", action);

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get(API_ROUTES.APPLICATIONS.ROOT, can("VIEW"), getApplications);

router.get(
  API_ROUTES.APPLICATIONS.GET_APPLICATION_GROUPS,
  can("VIEW"),
  getApplicationGroups
);

router.get(
  API_ROUTES.APPLICATIONS.GET_APPLICATION_ROLES,
  can("VIEW"),
  getApplicationRoles
);

router.get(API_ROUTES.APPLICATIONS.BY_ID, can("VIEW"), getApplicationById);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post(
  API_ROUTES.APPLICATIONS.ROOT,
  can("CREATE"),
  upload.array("attachments"),
  validateDto(CreateApplicationDto),
  createApplication
);

router.post(
  API_ROUTES.APPLICATIONS.DUPLICATE_BY_ID,
  can("CREATE"),
  duplicateApplication
);

router.post(
  API_ROUTES.APPLICATIONS.BULK_DELETE,
  can("DELETE"),
  bulkDeleteApplications
);

router.post(
  API_ROUTES.APPLICATIONS.BULK_DUPLICATE,
  can("CREATE"),
  bulkDuplicateApplications
);

router.post(
  API_ROUTES.APPLICATIONS.BULK_COPY,
  can("CREATE"),
  validateDto(BulkCreateDto),
  validateDtoArray(CreateApplicationDto, "records"),
  bulkCopyApplications
);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

// bulk-update/bulk-restore MUST register before BY_ID ("/:id") — same one-segment
// path shape, and Express matches whichever is registered first.
router.patch(
  API_ROUTES.APPLICATIONS.BULK_UPDATE,
  can("UPDATE"),
  validateDto(BulkUpdateDto),
  validateDtoArray(UpdateApplicationDto, "updates", "payload"),
  bulkUpdateApplications
);

router.patch(
  API_ROUTES.APPLICATIONS.BULK_RESTORE,
  can("UPDATE"),
  validateDto(BulkOperationDto),
  bulkRestoreApplications
);

router.patch(
  API_ROUTES.APPLICATIONS.ENABLE_BY_ID,
  can("UPDATE"),
  enableApplication
);

router.patch(
  API_ROUTES.APPLICATIONS.DISABLE_BY_ID,
  can("UPDATE"),
  disableApplication
);

router.patch(
  API_ROUTES.APPLICATIONS.BY_ID,
  can("UPDATE"),
  upload.array("attachments"),
  validateDto(UpdateApplicationDto),
  updateAppplication
);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

router.delete(
  API_ROUTES.APPLICATIONS.DELETE_ATTACHMENTS,
  can("UPDATE"),
  deleteAttachments
);

router.delete(API_ROUTES.APPLICATIONS.BY_ID, can("DELETE"), deleteApplication);

export default router;
