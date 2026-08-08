import { Router } from "express";
import * as controller from "../controllers/lot.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateLotDto, UpdateLotDto } from "../dtos/execution.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

const router = Router();
const ENTITY_NAME = "LOT";

router.post("/", validateDto(CreateLotDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createLot);
router.get("/", controller.getAllLots);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getLotById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateLotDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateLot);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteLot);

export default router;
