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
import { validateDto } from "../middlewares/validate-dto.middleware";
import {
  CreateEnvironmentDto,
  UpdateEnvironmentDto
} from "../dtos/environment.dto";

const router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get(API_ROUTES.ENVIRONMENT.ROOT, getEnvironments);

router.get(API_ROUTES.ENVIRONMENT.BY_ID, getEnvironmentById);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post(
  API_ROUTES.ENVIRONMENT.ROOT,
  validateDto(CreateEnvironmentDto),
  createEnvironment
);

router.post(API_ROUTES.ENVIRONMENT.BULK_DELETE, bulkDeleteEnvironments);

router.post(API_ROUTES.ENVIRONMENT.BULK_DUPLICATE, bulkDuplicateEnvironments);

router.post(API_ROUTES.ENVIRONMENT.BULK_COPY, bulkCopyEnvironments);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

// bulk-update/bulk-restore MUST register before BY_ID ("/:id") — same one-segment
// path shape, and Express matches whichever is registered first.
router.patch(API_ROUTES.ENVIRONMENT.BULK_UPDATE, bulkUpdateEnvironments);

router.patch(API_ROUTES.ENVIRONMENT.BULK_RESTORE, bulkRestoreEnvironments);

router.patch(
  API_ROUTES.ENVIRONMENT.BY_ID,
  validateDto(UpdateEnvironmentDto),
  updateEnvironment
);

router.patch(API_ROUTES.ENVIRONMENT.ENABLE_BY_ID, enableEnvironment);

router.patch(API_ROUTES.ENVIRONMENT.DISABLE_BY_ID, disableEnvironment);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

router.delete(API_ROUTES.ENVIRONMENT.BY_ID, deleteEnvironment);

export default router;
