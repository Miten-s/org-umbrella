import { Router } from "express";
import * as controller from "../controllers/analysis.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateAnalysisDto, UpdateAnalysisDto } from "../dtos/analytical.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

const router = Router();
const ENTITY_NAME = "ANALYSIS";

router.post("/", validateDto(CreateAnalysisDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createAnalysis);
router.get("/", controller.getAllAnalyses);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getAnalysisById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateAnalysisDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateAnalysis);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteAnalysis);

export default router;
