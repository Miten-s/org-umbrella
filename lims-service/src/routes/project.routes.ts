import { Router } from "express";
import * as controller from "../controllers/project.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateProjectDto, UpdateProjectDto } from "../dtos/org.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

const router = Router();
const ENTITY_NAME = "PROJECT";

router.post("/", validateDto(CreateProjectDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createProject);
router.get("/", controller.getAllProjects);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getProjectById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateProjectDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateProject);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteProject);

export default router;
