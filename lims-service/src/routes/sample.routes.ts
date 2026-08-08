import { Router } from "express";
import * as controller from "../controllers/sample.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateSampleDto, UpdateSampleDto, BulkLoginSampleDto } from "../dtos/execution.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

const router = Router();
const ENTITY_NAME = "SAMPLE";

router.post("/", validateDto(CreateSampleDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createSample);
router.post("/login", validateDto(CreateSampleDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.loginSample);
router.post("/bulk-login", validateDto(BulkLoginSampleDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.bulkLoginSamples);
router.get("/", controller.getAllSamples);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getSampleById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateSampleDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateSample);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteSample);

export default router;
