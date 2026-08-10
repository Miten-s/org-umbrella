import { AppError } from "../middlewares/error.middleware";
import { Router } from "express";
import * as controller from "../controllers/stock-batch.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateStockBatchDto, UpdateStockBatchDto } from "../dtos/physical.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

import { BulkOperationDto, RestoreOperationDto } from "../dtos/common.dto";


const router = Router();
const ENTITY_NAME = "STOCK_BATCH";

router.post("/", validateDto(CreateStockBatchDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createStockBatch);
router.get("/", controller.getAllStockBatches);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getStockBatchById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateStockBatchDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateStockBatch);
router.patch(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateStockBatchDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateStockBatch);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteStockBatch);

// ─── Bulk / Restore endpoints ────────────────────────────────────────────────
router.post(API_ROUTES.BULK_DELETE, validateDto(BulkOperationDto, "body"), controller.bulkDelete);
router.post(API_ROUTES.BULK_DUPLICATE, validateDto(BulkOperationDto, "body"), controller.bulkDuplicate);
router.patch(API_ROUTES.RESTORE, validateDto(RestoreOperationDto, "body"), controller.restore);
router.get(API_ROUTES.AUDIT_LOGS, controller.getAuditLogs);

export default router;

