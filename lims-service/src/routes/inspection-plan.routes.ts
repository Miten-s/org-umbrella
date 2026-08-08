import { Router } from "express";
import * as controller from "../controllers/inspection-plan.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateInspectionPlanDto, UpdateInspectionPlanDto } from "../dtos/instrument.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

const router = Router();
const ENTITY_NAME = "INSPECTION_PLAN";

router.post("/", validateDto(CreateInspectionPlanDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createInspectionPlan);
router.get("/", controller.getAllInspectionPlans);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getInspectionPlanById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateInspectionPlanDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateInspectionPlan);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteInspectionPlan);

export default router;
