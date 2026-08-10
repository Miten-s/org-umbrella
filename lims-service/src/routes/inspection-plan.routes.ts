import { AppError } from "../middlewares/error.middleware";
import { Router } from "express";
import * as controller from "../controllers/inspection-plan.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateInspectionPlanDto, UpdateInspectionPlanDto } from "../dtos/instrument.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

import { BulkOperationDto, RestoreOperationDto } from "../dtos/common.dto";


const router = Router();
const ENTITY_NAME = "INSPECTION_PLAN";

router.post("/", validateDto(CreateInspectionPlanDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createInspectionPlan);
router.get("/", controller.getAllInspectionPlans);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getInspectionPlanById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateInspectionPlanDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateInspectionPlan);
router.patch(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateInspectionPlanDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateInspectionPlan);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteInspectionPlan);

// ─── Bulk / Restore endpoints ────────────────────────────────────────────────
router.post(API_ROUTES.BULK_DELETE, validateDto(BulkOperationDto, "body"), controller.bulkDelete);
router.post(API_ROUTES.BULK_DUPLICATE, validateDto(BulkOperationDto, "body"), controller.bulkDuplicate);
router.patch(API_ROUTES.RESTORE, validateDto(RestoreOperationDto, "body"), controller.restore);
router.get(API_ROUTES.AUDIT_LOGS, controller.getAuditLogs);

export default router;

