import { AppError } from "../middlewares/error.middleware";
import { Router } from "express";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateRoleDto, UpdateRoleDto } from "../dtos/entities.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import * as controller from "../controllers/entities.controller";
import API_ROUTES from "../utils/routes";

import { BulkOperationDto, RestoreOperationDto } from "../dtos/common.dto";


const router = Router();
const ENTITY_NAME = "ROLE";

router.post("/",              validateDto(CreateRoleDto, "body"),  auditMiddleware(ENTITY_NAME, false), controller.createRole);
router.get("/",                                                                                         controller.getAllRoles);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"),                               controller.getRoleById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateRoleDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateRole);
router.patch(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateRoleDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateRole);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteRole);

// ─── Bulk / Restore endpoints ────────────────────────────────────────────────
router.post(API_ROUTES.BULK_DELETE, validateDto(BulkOperationDto, "body"), controller.bulkDeleteRole);
router.post(API_ROUTES.BULK_DUPLICATE, validateDto(BulkOperationDto, "body"), controller.bulkDuplicateRole);
router.patch(API_ROUTES.RESTORE, validateDto(RestoreOperationDto, "body"), controller.restoreRole);
router.get(API_ROUTES.AUDIT_LOGS, controller.getAuditLogsRole);

export default router;

