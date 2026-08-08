import { Router } from "express";
import * as controller from "../controllers/test.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateTestDto, UpdateTestDto } from "../dtos/execution.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

const router = Router();
const ENTITY_NAME = "TEST";

router.post("/", validateDto(CreateTestDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createTest);
router.get("/", controller.getAllTests);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getTestById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateTestDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateTest);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteTest);

export default router;
