import { Router } from "express";

import {
  createEnvironment,
  deleteEnvironment,
  getEnvironments,
  getEnvironmentById,
  enableEnvironment,
  updateEnvironment,
  disableEnvironment,
  bulkDeleteEnvironments,
  bulkDuplicateEnvironments,
  bulkCopyEnvironments,
  bulkUpdateEnvironments,
  bulkRestoreEnvironments
} from "../controllers/gxp-service-environments.controller";
import API_ROUTES from "../utils/routes";
import {
  validateDto,
  validateDtoArray
} from "../middlewares/validate-dto.middleware";
import {
  CreateEnvironmentDto,
  UpdateEnvironmentDto
} from "../dtos/environment.dto";
import {
  BulkCreateDto,
  BulkUpdateDto,
  BulkOperationDto
} from "../dtos/common.dto";
import { authorize } from "../middlewares/authorize.middleware";

const router = Router();
const can = (action: "VIEW" | "CREATE" | "UPDATE" | "DELETE") =>
  authorize("ENVIRONMENT", action);

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get(API_ROUTES.ENVIRONMENT.ROOT, can("VIEW"), getEnvironments);

router.get(API_ROUTES.ENVIRONMENT.BY_ID, can("VIEW"), getEnvironmentById);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post(
  API_ROUTES.ENVIRONMENT.ROOT,
  can("CREATE"),
  validateDto(CreateEnvironmentDto),
  createEnvironment
);

router.post(
  API_ROUTES.ENVIRONMENT.BULK_DELETE,
  can("DELETE"),
  bulkDeleteEnvironments
);

router.post(
  API_ROUTES.ENVIRONMENT.BULK_DUPLICATE,
  can("CREATE"),
  bulkDuplicateEnvironments
);

router.post(
  API_ROUTES.ENVIRONMENT.BULK_COPY,
  can("CREATE"),
  validateDto(BulkCreateDto),
  validateDtoArray(CreateEnvironmentDto, "records"),
  bulkCopyEnvironments
);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

// bulk-update/bulk-restore MUST register before BY_ID ("/:id") — same one-segment
// path shape, and Express matches whichever is registered first.
router.patch(
  API_ROUTES.ENVIRONMENT.BULK_UPDATE,
  can("UPDATE"),
  validateDto(BulkUpdateDto),
  validateDtoArray(UpdateEnvironmentDto, "updates", "payload"),
  bulkUpdateEnvironments
);

router.patch(
  API_ROUTES.ENVIRONMENT.BULK_RESTORE,
  can("UPDATE"),
  validateDto(BulkOperationDto),
  bulkRestoreEnvironments
);

router.patch(
  API_ROUTES.ENVIRONMENT.BY_ID,
  can("UPDATE"),
  validateDto(UpdateEnvironmentDto),
  updateEnvironment
);

router.patch(
  API_ROUTES.ENVIRONMENT.ENABLE_BY_ID,
  can("UPDATE"),
  enableEnvironment
);

router.patch(
  API_ROUTES.ENVIRONMENT.DISABLE_BY_ID,
  can("UPDATE"),
  disableEnvironment
);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

router.delete(API_ROUTES.ENVIRONMENT.BY_ID, can("DELETE"), deleteEnvironment);

export default router;
