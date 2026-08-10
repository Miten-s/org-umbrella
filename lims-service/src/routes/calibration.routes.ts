import { AppError } from "../middlewares/error.middleware";
import { Router } from "express";
import * as controller from "../controllers/calibration.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateCalibrationDto, UpdateCalibrationDto } from "../dtos/instrument.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

import { BulkOperationDto, RestoreOperationDto } from "../dtos/common.dto";


const router = Router();
const ENTITY_NAME = "CALIBRATION";

router.post("/", validateDto(CreateCalibrationDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createCalibration);
router.get("/", controller.getAllCalibrations);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getCalibrationById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateCalibrationDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateCalibration);
router.patch(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateCalibrationDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateCalibration);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteCalibration);

// ─── Bulk / Restore endpoints ────────────────────────────────────────────────
router.post(API_ROUTES.BULK_DELETE, validateDto(BulkOperationDto, "body"), controller.bulkDelete);
router.post(API_ROUTES.BULK_DUPLICATE, validateDto(BulkOperationDto, "body"), controller.bulkDuplicate);
router.patch(API_ROUTES.RESTORE, validateDto(RestoreOperationDto, "body"), controller.restore);
router.get(API_ROUTES.AUDIT_LOGS, controller.getAuditLogs);

export default router;

