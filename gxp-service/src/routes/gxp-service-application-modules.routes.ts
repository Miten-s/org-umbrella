import { Router } from "express";
import {
  createApplicationModule,
  getApplicationModules,
  getApplicationModuleById,
  updateAppplicationModule,
  updateApplicationModuleStatus,
  deleteApplicationModule,
  bulkDeleteApplicationModules,
  bulkDuplicateApplicationModules,
  bulkCopyApplicationModules,
  bulkUpdateApplicationModules,
  bulkRestoreApplicationModules
} from "../controllers/gxp-service-application-modules.controller";
import API_ROUTES from "../utils/routes";
import {
  validateDto,
  validateDtoArray
} from "../middlewares/validate-dto.middleware";
import { CreateAppModuleDto } from "../dtos/master-data.dto";
import {
  BulkCreateDto,
  BulkUpdateDto,
  BulkOperationDto
} from "../dtos/common.dto";
import { authorize } from "../middlewares/authorize.middleware";

const router = Router();
const can = (action: "VIEW" | "CREATE" | "UPDATE" | "DELETE") =>
  authorize("APPLICATION_MODULE", action);

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get(
  API_ROUTES.APPLICATION_MODULES.ROOT,
  can("VIEW"),
  getApplicationModules
);

router.get(
  API_ROUTES.APPLICATION_MODULES.BY_ID,
  can("VIEW"),
  getApplicationModuleById
);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post(
  API_ROUTES.APPLICATION_MODULES.ROOT,
  can("CREATE"),
  createApplicationModule
);

router.post(
  API_ROUTES.APPLICATION_MODULES.BULK_DELETE,
  can("DELETE"),
  bulkDeleteApplicationModules
);
router.post(
  API_ROUTES.APPLICATION_MODULES.BULK_DUPLICATE,
  can("CREATE"),
  bulkDuplicateApplicationModules
);
router.post(
  API_ROUTES.APPLICATION_MODULES.BULK_COPY,
  can("CREATE"),
  validateDto(BulkCreateDto),
  validateDtoArray(CreateAppModuleDto, "records"),
  bulkCopyApplicationModules
);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

// bulk-update/bulk-restore MUST register before BY_ID ("/:id") — same one-segment
// path shape, and Express matches whichever is registered first.
// No UpdateAppModuleDto exists yet — same as the single-record PATCH below, which
// also runs unvalidated; only the batch-size cap applies here.
router.patch(
  API_ROUTES.APPLICATION_MODULES.BULK_UPDATE,
  can("UPDATE"),
  validateDto(BulkUpdateDto),
  bulkUpdateApplicationModules
);
router.patch(
  API_ROUTES.APPLICATION_MODULES.BULK_RESTORE,
  can("UPDATE"),
  validateDto(BulkOperationDto),
  bulkRestoreApplicationModules
);

router.patch(
  API_ROUTES.APPLICATION_MODULES.BY_ID,
  can("UPDATE"),
  updateAppplicationModule
);

router.patch(
  API_ROUTES.APPLICATION_MODULES.STATUS_BY_ID,
  can("UPDATE"),
  updateApplicationModuleStatus
);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

router.delete(
  API_ROUTES.APPLICATION_MODULES.BY_ID,
  can("DELETE"),
  deleteApplicationModule
);

export default router;
