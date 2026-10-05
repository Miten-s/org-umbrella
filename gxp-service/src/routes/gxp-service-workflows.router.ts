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
import {
  validateDto,
  validateDtoArray
} from "../middlewares/validate-dto.middleware";
import { CreateWorkflowDto, UpdateWorkflowDto } from "../dtos/workflow.dto";
import {
  BulkCreateDto,
  BulkUpdateDto,
  BulkOperationDto
} from "../dtos/common.dto";
import { authorize } from "../middlewares/authorize.middleware";

const router: Router = Router();
const can = (action: "VIEW" | "CREATE" | "UPDATE" | "DELETE") =>
  authorize("WORKFLOW", action);

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get(API_ROUTES.WORKFLOWS.ROOT, can("VIEW"), getAllWorkflows);

router.get(API_ROUTES.WORKFLOWS.BY_ID, can("VIEW"), getWorkflowById);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post(
  API_ROUTES.WORKFLOWS.ROOT,
  can("CREATE"),
  validateDto(CreateWorkflowDto),
  createWorkflow
);

router.post(
  API_ROUTES.WORKFLOWS.BULK_DELETE,
  can("DELETE"),
  bulkDeleteWorkflows
);
router.post(
  API_ROUTES.WORKFLOWS.BULK_DUPLICATE,
  can("CREATE"),
  bulkDuplicateWorkflows
);
router.post(
  API_ROUTES.WORKFLOWS.BULK_COPY,
  can("CREATE"),
  validateDto(BulkCreateDto),
  validateDtoArray(CreateWorkflowDto, "records"),
  bulkCopyWorkflows
);

// ---------------------------------------------------------------------------------------- PUT Requests ----------------------------------------------------------------------------------------

// bulk-update/bulk-restore MUST register before BY_ID ("/:workflowId") — same
// one-segment path shape, and Express matches whichever is registered first.
router.patch(
  API_ROUTES.WORKFLOWS.BULK_UPDATE,
  can("UPDATE"),
  validateDto(BulkUpdateDto),
  validateDtoArray(UpdateWorkflowDto, "updates", "payload"),
  bulkUpdateWorkflows
);

router.patch(
  API_ROUTES.WORKFLOWS.BULK_RESTORE,
  can("UPDATE"),
  validateDto(BulkOperationDto),
  bulkRestoreWorkflows
);

router.patch(API_ROUTES.WORKFLOWS.ENABLE_BY_ID, can("UPDATE"), enableWorkflow);

router.patch(
  API_ROUTES.WORKFLOWS.DISABLE_BY_ID,
  can("UPDATE"),
  disableWorkflow
);

router.patch(
  API_ROUTES.WORKFLOWS.BY_ID,
  can("UPDATE"),
  validateDto(UpdateWorkflowDto),
  updateWorkflow
);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

router.delete(API_ROUTES.WORKFLOWS.BY_ID, can("DELETE"), deleteWorkflow);

export default router;
