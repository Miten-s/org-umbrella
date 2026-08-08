import { Router } from "express";
import * as controller from "../controllers/analysis-component.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateAnalysisComponentDto, UpdateAnalysisComponentDto } from "../dtos/analytical.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

const router = Router();
const ENTITY_NAME = "ANALYSIS_COMPONENT";

router.post("/", validateDto(CreateAnalysisComponentDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createAnalysisComponent);
router.get("/", controller.getAllAnalysisComponents);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getAnalysisComponentById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateAnalysisComponentDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateAnalysisComponent);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteAnalysisComponent);

export default router;
