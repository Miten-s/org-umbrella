import { AppError } from "../middlewares/error.middleware";
import { Router } from "express";
import * as controller from "../controllers/spec-limit.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateSpecLimitDto, UpdateSpecLimitDto } from "../dtos/analytical.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

import { BulkOperationDto, RestoreOperationDto } from "../dtos/common.dto";


const router = Router();
const ENTITY_NAME = "SPEC_LIMIT";

router.post("/", validateDto(CreateSpecLimitDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createSpecLimit);
router.get("/", controller.getAllSpecLimits);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getSpecLimitById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateSpecLimitDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateSpecLimit);
router.patch(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateSpecLimitDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateSpecLimit);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteSpecLimit);

// ─── Bulk / Restore endpoints ────────────────────────────────────────────────
router.post(API_ROUTES.BULK_DELETE, validateDto(BulkOperationDto, "body"), controller.bulkDelete);
router.post(API_ROUTES.BULK_DUPLICATE, validateDto(BulkOperationDto, "body"), controller.bulkDuplicate);
router.patch(API_ROUTES.RESTORE, validateDto(RestoreOperationDto, "body"), controller.restore);
router.get(API_ROUTES.AUDIT_LOGS, controller.getAuditLogs);

export default router;

