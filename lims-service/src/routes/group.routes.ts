import { AppError } from "../middlewares/error.middleware";
import { Router } from "express";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateGroupDto, UpdateGroupDto } from "../dtos/entities.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import * as controller from "../controllers/entities.controller";
import API_ROUTES from "../utils/routes";

import { BulkOperationDto, RestoreOperationDto } from "../dtos/common.dto";


const router = Router();
const ENTITY_NAME = "GROUP";

router.post("/",              validateDto(CreateGroupDto, "body"),  auditMiddleware(ENTITY_NAME, false), controller.createGroup);
router.get("/",                                                                                          controller.getAllGroups);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"),                                controller.getGroupById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateGroupDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateGroup);
router.patch(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateGroupDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateGroup);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteGroup);

// ─── Bulk / Restore endpoints ────────────────────────────────────────────────
router.post(API_ROUTES.BULK_DELETE, validateDto(BulkOperationDto, "body"), controller.bulkDeleteGroup);
router.post(API_ROUTES.BULK_DUPLICATE, validateDto(BulkOperationDto, "body"), controller.bulkDuplicateGroup);
router.patch(API_ROUTES.RESTORE, validateDto(RestoreOperationDto, "body"), controller.restoreGroup);
router.get(API_ROUTES.AUDIT_LOGS, controller.getAuditLogsGroup);

export default router;

