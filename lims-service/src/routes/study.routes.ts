import { Router } from "express";
import * as controller from "../controllers/study.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateStudyDto, UpdateStudyDto } from "../dtos/org.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

const router = Router();
const ENTITY_NAME = "STUDY";

router.post("/", validateDto(CreateStudyDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createStudy);
router.get("/", controller.getAllStudies);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getStudyById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateStudyDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateStudy);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteStudy);

export default router;
