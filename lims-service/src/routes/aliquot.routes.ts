import { Router } from "express";
import * as controller from "../controllers/aliquot.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateAliquotDto, UpdateAliquotDto } from "../dtos/physical.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

const router = Router();
const ENTITY_NAME = "ALIQUOT";

router.post("/", validateDto(CreateAliquotDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createAliquot);
router.get("/", controller.getAllAliquots);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getAliquotById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateAliquotDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateAliquot);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteAliquot);

export default router;
