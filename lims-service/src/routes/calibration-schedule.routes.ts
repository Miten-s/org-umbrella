import { Router } from "express";
import * as controller from "../controllers/calibration-schedule.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateCalibrationScheduleDto, UpdateCalibrationScheduleDto } from "../dtos/instrument.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

const router = Router();
const ENTITY_NAME = "CALIBRATION_SCHEDULE";

router.post("/", validateDto(CreateCalibrationScheduleDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createCalibrationSchedule);
router.get("/", controller.getAllCalibrationSchedules);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getCalibrationScheduleById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateCalibrationScheduleDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateCalibrationSchedule);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteCalibrationSchedule);

export default router;
