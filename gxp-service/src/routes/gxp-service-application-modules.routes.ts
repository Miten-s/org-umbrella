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

const router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get(API_ROUTES.APPLICATION_MODULES.ROOT, getApplicationModules);

router.get(API_ROUTES.APPLICATION_MODULES.BY_ID, getApplicationModuleById);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post(API_ROUTES.APPLICATION_MODULES.ROOT, createApplicationModule);

router.post(
  API_ROUTES.APPLICATION_MODULES.BULK_DELETE,
  bulkDeleteApplicationModules
);
router.post(
  API_ROUTES.APPLICATION_MODULES.BULK_DUPLICATE,
  bulkDuplicateApplicationModules
);
router.post(
  API_ROUTES.APPLICATION_MODULES.BULK_COPY,
  bulkCopyApplicationModules
);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

// bulk-update/bulk-restore MUST register before BY_ID ("/:id") — same one-segment
// path shape, and Express matches whichever is registered first.
router.patch(
  API_ROUTES.APPLICATION_MODULES.BULK_UPDATE,
  bulkUpdateApplicationModules
);
router.patch(
  API_ROUTES.APPLICATION_MODULES.BULK_RESTORE,
  bulkRestoreApplicationModules
);

router.patch(API_ROUTES.APPLICATION_MODULES.BY_ID, updateAppplicationModule);

router.patch(
  API_ROUTES.APPLICATION_MODULES.STATUS_BY_ID,
  updateApplicationModuleStatus
);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

router.delete(API_ROUTES.APPLICATION_MODULES.BY_ID, deleteApplicationModule);

export default router;
