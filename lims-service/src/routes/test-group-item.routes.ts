import { AppError } from "../middlewares/error.middleware";
import { Router } from "express";
import * as controller from "../controllers/test-group-item.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateTestGroupItemDto, UpdateTestGroupItemDto } from "../dtos/analytical.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

import { BulkOperationDto, RestoreOperationDto } from "../dtos/common.dto";


const router = Router();
const ENTITY_NAME = "TEST_GROUP_ITEM";

router.post("/", validateDto(CreateTestGroupItemDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createTestGroupItem);
router.get("/", controller.getAllTestGroupItems);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getTestGroupItemById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateTestGroupItemDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateTestGroupItem);
router.patch(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateTestGroupItemDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateTestGroupItem);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteTestGroupItem);

// ─── Bulk / Restore endpoints ────────────────────────────────────────────────
router.post(API_ROUTES.BULK_DELETE, validateDto(BulkOperationDto, "body"), controller.bulkDelete);
router.post(API_ROUTES.BULK_DUPLICATE, validateDto(BulkOperationDto, "body"), controller.bulkDuplicate);
router.patch(API_ROUTES.RESTORE, validateDto(RestoreOperationDto, "body"), controller.restore);
router.get(API_ROUTES.AUDIT_LOGS, controller.getAuditLogs);

export default router;

