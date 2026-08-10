import { AppError } from "../middlewares/error.middleware";
import { Router } from "express";
import * as controller from "../controllers/stock.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateStockDto, UpdateStockDto } from "../dtos/physical.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

import { BulkOperationDto, RestoreOperationDto } from "../dtos/common.dto";


const router = Router();
const ENTITY_NAME = "STOCK";

router.post("/", validateDto(CreateStockDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createStock);
router.get("/", controller.getAllStock);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getStockById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateStockDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateStock);
router.patch(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateStockDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateStock);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteStock);

// ─── Bulk / Restore endpoints ────────────────────────────────────────────────
router.post(API_ROUTES.BULK_DELETE, validateDto(BulkOperationDto, "body"), controller.bulkDelete);
router.post(API_ROUTES.BULK_DUPLICATE, validateDto(BulkOperationDto, "body"), controller.bulkDuplicate);
router.patch(API_ROUTES.RESTORE, validateDto(RestoreOperationDto, "body"), controller.restore);
router.get(API_ROUTES.AUDIT_LOGS, controller.getAuditLogs);

export default router;

