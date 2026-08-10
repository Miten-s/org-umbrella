import { AppError } from "../middlewares/error.middleware";
import { Router } from "express";
import * as controller from "../controllers/study.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateStudyDto, UpdateStudyDto } from "../dtos/org.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

import { BulkOperationDto, RestoreOperationDto } from "../dtos/common.dto";


const router = Router();
const ENTITY_NAME = "STUDY";

router.post("/", validateDto(CreateStudyDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createStudy);
router.get("/", controller.getAllStudies);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getStudyById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateStudyDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateStudy);
router.patch(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateStudyDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateStudy);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteStudy);

// ─── Bulk / Restore endpoints ────────────────────────────────────────────────
router.post(API_ROUTES.BULK_DELETE, validateDto(BulkOperationDto, "body"), controller.bulkDelete);
router.post(API_ROUTES.BULK_DUPLICATE, validateDto(BulkOperationDto, "body"), controller.bulkDuplicate);
router.patch(API_ROUTES.RESTORE, validateDto(RestoreOperationDto, "body"), controller.restore);
router.get(API_ROUTES.AUDIT_LOGS, controller.getAuditLogs);

export default router;

