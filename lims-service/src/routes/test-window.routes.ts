import { Router } from "express";
import * as controller from "../controllers/test-window.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateTestWindowDto, UpdateTestWindowDto } from "../dtos/execution.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

const router = Router();
const ENTITY_NAME = "TEST_WINDOW";

router.post("/", validateDto(CreateTestWindowDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createTestWindow);
router.get("/", controller.getAllTestWindows);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getTestWindowById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateTestWindowDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateTestWindow);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteTestWindow);

export default router;
