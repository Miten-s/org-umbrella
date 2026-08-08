import { Router } from "express";
import * as controller from "../controllers/result.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateResultDto, UpdateResultDto } from "../dtos/execution.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

const router = Router();
const ENTITY_NAME = "RESULT";

router.post("/", validateDto(CreateResultDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createResult);
router.get("/", controller.getAllResults);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getResultById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateResultDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateResult);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteResult);

export default router;
