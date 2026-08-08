import { Router } from "express";
import * as controller from "../controllers/calibration.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateCalibrationDto, UpdateCalibrationDto } from "../dtos/instrument.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

const router = Router();
const ENTITY_NAME = "CALIBRATION";

router.post("/", validateDto(CreateCalibrationDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createCalibration);
router.get("/", controller.getAllCalibrations);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getCalibrationById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateCalibrationDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateCalibration);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteCalibration);

export default router;
