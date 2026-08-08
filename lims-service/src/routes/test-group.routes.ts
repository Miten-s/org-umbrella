import { Router } from "express";
import * as controller from "../controllers/test-group.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateTestGroupDto, UpdateTestGroupDto } from "../dtos/analytical.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

const router = Router();
const ENTITY_NAME = "TEST_GROUP";

router.post("/", validateDto(CreateTestGroupDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createTestGroup);
router.get("/", controller.getAllTestGroups);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getTestGroupById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateTestGroupDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateTestGroup);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteTestGroup);

export default router;
