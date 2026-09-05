import { Router } from "express";
import API_ROUTES from "../utils/routes";
import {
  getAllWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  disableWorkflow,
  enableWorkflow,
  deleteWorkflow,
  bulkDeleteWorkflows,
  bulkDuplicateWorkflows,
  bulkCopyWorkflows,
  bulkUpdateWorkflows,
  bulkRestoreWorkflows
} from "../controllers/gxp-service-workflows.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateWorkflowDto, UpdateWorkflowDto } from "../dtos/workflow.dto";

const router: Router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get(API_ROUTES.WORKFLOWS.ROOT, getAllWorkflows);

router.get(API_ROUTES.WORKFLOWS.BY_ID, getWorkflowById);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post(
  API_ROUTES.WORKFLOWS.ROOT,
  validateDto(CreateWorkflowDto),
  createWorkflow
);

router.post(API_ROUTES.WORKFLOWS.BULK_DELETE, bulkDeleteWorkflows);
router.post(API_ROUTES.WORKFLOWS.BULK_DUPLICATE, bulkDuplicateWorkflows);
router.post(API_ROUTES.WORKFLOWS.BULK_COPY, bulkCopyWorkflows);

// ---------------------------------------------------------------------------------------- PUT Requests ----------------------------------------------------------------------------------------

// bulk-update/bulk-restore MUST register before BY_ID ("/:workflowId") — same
// one-segment path shape, and Express matches whichever is registered first.
router.patch(API_ROUTES.WORKFLOWS.BULK_UPDATE, bulkUpdateWorkflows);

router.patch(API_ROUTES.WORKFLOWS.BULK_RESTORE, bulkRestoreWorkflows);

router.patch(API_ROUTES.WORKFLOWS.ENABLE_BY_ID, enableWorkflow);

router.patch(API_ROUTES.WORKFLOWS.DISABLE_BY_ID, disableWorkflow);

router.patch(
  API_ROUTES.WORKFLOWS.BY_ID,
  validateDto(UpdateWorkflowDto),
  updateWorkflow
);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

router.delete(API_ROUTES.WORKFLOWS.BY_ID, deleteWorkflow);

export default router;
