import { AppError } from "../middlewares/error.middleware";
import { Router } from "express";
import * as controller from "../controllers/sample.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateSampleDto, UpdateSampleDto, BulkLoginSampleDto } from "../dtos/execution.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

import { BulkOperationDto, RestoreOperationDto } from "../dtos/common.dto";


const router = Router();
const ENTITY_NAME = "SAMPLE";

router.post("/", validateDto(CreateSampleDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createSample);
router.post("/login", validateDto(CreateSampleDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.loginSample);
router.post("/bulk-login", validateDto(BulkLoginSampleDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.bulkLoginSamples);
router.get("/", controller.getAllSamples);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getSampleById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateSampleDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateSample);
router.patch(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateSampleDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateSample);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteSample);

// ─── Bulk / Restore endpoints ────────────────────────────────────────────────
router.post(API_ROUTES.BULK_DELETE, validateDto(BulkOperationDto, "body"), controller.bulkDelete);
router.post(API_ROUTES.BULK_DUPLICATE, validateDto(BulkOperationDto, "body"), controller.bulkDuplicate);
router.patch(API_ROUTES.RESTORE, validateDto(RestoreOperationDto, "body"), controller.restore);
router.get(API_ROUTES.AUDIT_LOGS, controller.getAuditLogs);

export default router;

