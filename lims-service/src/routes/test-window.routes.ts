import { AppError } from "../middlewares/error.middleware";
import { Router } from "express";
import * as controller from "../controllers/test-window.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateTestWindowDto, UpdateTestWindowDto } from "../dtos/execution.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

import { BulkOperationDto, RestoreOperationDto } from "../dtos/common.dto";


const router = Router();
const ENTITY_NAME = "TEST_WINDOW";

router.post("/", validateDto(CreateTestWindowDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createTestWindow);
router.get("/", controller.getAllTestWindows);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getTestWindowById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateTestWindowDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateTestWindow);
router.patch(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateTestWindowDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateTestWindow);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteTestWindow);

// ─── Bulk / Restore endpoints ────────────────────────────────────────────────
router.post(API_ROUTES.BULK_DELETE, validateDto(BulkOperationDto, "body"), controller.bulkDelete);
router.post(API_ROUTES.BULK_DUPLICATE, validateDto(BulkOperationDto, "body"), controller.bulkDuplicate);
router.patch(API_ROUTES.RESTORE, validateDto(RestoreOperationDto, "body"), controller.restore);
router.get(API_ROUTES.AUDIT_LOGS, controller.getAuditLogs);

export default router;

