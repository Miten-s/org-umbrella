import { AppError } from "../middlewares/error.middleware";
import { Router } from "express";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateSchedulerDto, UpdateSchedulerDto } from "../dtos/entities.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import * as controller from "../controllers/entities.controller";
import API_ROUTES from "../utils/routes";

import { BulkOperationDto, RestoreOperationDto } from "../dtos/common.dto";


const router = Router();
const ENTITY_NAME = "SCHEDULER";

router.post("/",              validateDto(CreateSchedulerDto, "body"),  auditMiddleware(ENTITY_NAME, false), controller.createScheduler);
router.get("/",                                                                                               controller.getAllSchedulers);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"),                                     controller.getSchedulerById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateSchedulerDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateScheduler);
router.patch(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateSchedulerDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateScheduler);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteScheduler);

// ─── Bulk / Restore endpoints ────────────────────────────────────────────────
router.post(API_ROUTES.BULK_DELETE, validateDto(BulkOperationDto, "body"), controller.bulkDeleteScheduler);
router.post(API_ROUTES.BULK_DUPLICATE, validateDto(BulkOperationDto, "body"), controller.bulkDuplicateScheduler);
router.patch(API_ROUTES.RESTORE, validateDto(RestoreOperationDto, "body"), controller.restoreScheduler);
router.get(API_ROUTES.AUDIT_LOGS, controller.getAuditLogsScheduler);

export default router;

