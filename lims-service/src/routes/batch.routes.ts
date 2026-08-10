import { AppError } from "../middlewares/error.middleware";
import { Router } from "express";
import * as controller from "../controllers/batch.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateBatchDto, UpdateBatchDto } from "../dtos/execution.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

import { BulkOperationDto, RestoreOperationDto } from "../dtos/common.dto";


const router = Router();
const ENTITY_NAME = "BATCH";

router.post("/", validateDto(CreateBatchDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createBatch);
router.get("/", controller.getAllBatches);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getBatchById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateBatchDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateBatch);
router.patch(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateBatchDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateBatch);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteBatch);

// ─── Bulk / Restore endpoints ────────────────────────────────────────────────
router.post(API_ROUTES.BULK_DELETE, validateDto(BulkOperationDto, "body"), controller.bulkDelete);
router.post(API_ROUTES.BULK_DUPLICATE, validateDto(BulkOperationDto, "body"), controller.bulkDuplicate);
router.patch(API_ROUTES.RESTORE, validateDto(RestoreOperationDto, "body"), controller.restore);
router.get(API_ROUTES.AUDIT_LOGS, controller.getAuditLogs);

export default router;

