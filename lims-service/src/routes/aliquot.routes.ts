import { AppError } from "../middlewares/error.middleware";
import { Router } from "express";
import * as controller from "../controllers/aliquot.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateAliquotDto, UpdateAliquotDto } from "../dtos/physical.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

import { BulkOperationDto, RestoreOperationDto } from "../dtos/common.dto";


const router = Router();
const ENTITY_NAME = "ALIQUOT";

router.post("/", validateDto(CreateAliquotDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createAliquot);
router.get("/", controller.getAllAliquots);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getAliquotById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateAliquotDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateAliquot);
router.patch(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateAliquotDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateAliquot);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteAliquot);

// ─── Bulk / Restore endpoints ────────────────────────────────────────────────
router.post(API_ROUTES.BULK_DELETE, validateDto(BulkOperationDto, "body"), controller.bulkDelete);
router.post(API_ROUTES.BULK_DUPLICATE, validateDto(BulkOperationDto, "body"), controller.bulkDuplicate);
router.patch(API_ROUTES.RESTORE, validateDto(RestoreOperationDto, "body"), controller.restore);
router.get(API_ROUTES.AUDIT_LOGS, controller.getAuditLogs);

export default router;

