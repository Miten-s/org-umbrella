import { AppError } from "../middlewares/error.middleware";
import { Router } from "express";
import * as controller from "../controllers/test-group.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateTestGroupDto, UpdateTestGroupDto } from "../dtos/analytical.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

import { BulkOperationDto, RestoreOperationDto } from "../dtos/common.dto";


const router = Router();
const ENTITY_NAME = "TEST_GROUP";

router.post("/", validateDto(CreateTestGroupDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createTestGroup);
router.get("/", controller.getAllTestGroups);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getTestGroupById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateTestGroupDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateTestGroup);
router.patch(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateTestGroupDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateTestGroup);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteTestGroup);

// ─── Bulk / Restore endpoints ────────────────────────────────────────────────
router.post(API_ROUTES.BULK_DELETE, validateDto(BulkOperationDto, "body"), controller.bulkDelete);
router.post(API_ROUTES.BULK_DUPLICATE, validateDto(BulkOperationDto, "body"), controller.bulkDuplicate);
router.patch(API_ROUTES.RESTORE, validateDto(RestoreOperationDto, "body"), controller.restore);
router.get(API_ROUTES.AUDIT_LOGS, controller.getAuditLogs);

export default router;

