import { Router } from "express";
import * as controller from "../controllers/specification.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateSpecificationDto, UpdateSpecificationDto } from "../dtos/analytical.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

const router = Router();
const ENTITY_NAME = "SPECIFICATION";

router.post("/", validateDto(CreateSpecificationDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createSpecification);
router.get("/", controller.getAllSpecifications);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getSpecificationById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateSpecificationDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateSpecification);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteSpecification);

export default router;
