import { AppError } from "../middlewares/error.middleware";
import { Router } from "express";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateLimsUserDto, UpdateLimsUserDto } from "../dtos/entities.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import * as controller from "../controllers/entities.controller";
import API_ROUTES from "../utils/routes";

import { BulkOperationDto, RestoreOperationDto } from "../dtos/common.dto";


const router = Router();
const ENTITY_NAME = "USER";

router.post("/",              validateDto(CreateLimsUserDto, "body"),  auditMiddleware(ENTITY_NAME, false), controller.createLimsUser);
router.get("/",                                                                                              controller.getAllLimsUsers);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"),                                    controller.getLimsUserById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateLimsUserDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateLimsUser);
router.patch(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateLimsUserDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateLimsUser);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteLimsUser);

// ─── Bulk / Restore endpoints ────────────────────────────────────────────────
router.post(API_ROUTES.BULK_DELETE, validateDto(BulkOperationDto, "body"), controller.bulkDeleteLimsUser);
router.post(API_ROUTES.BULK_DUPLICATE, validateDto(BulkOperationDto, "body"), controller.bulkDuplicateLimsUser);
router.patch(API_ROUTES.RESTORE, validateDto(RestoreOperationDto, "body"), controller.restoreLimsUser);
router.get(API_ROUTES.AUDIT_LOGS, controller.getAuditLogsLimsUser);

export default router;

