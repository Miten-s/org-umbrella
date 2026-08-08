import { Router } from "express";
import * as controller from "../controllers/instrument.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateInstrumentDto, UpdateInstrumentDto } from "../dtos/instrument.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

const router = Router();
const ENTITY_NAME = "INSTRUMENT";

router.post("/", validateDto(CreateInstrumentDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createInstrument);
router.get("/", controller.getAllInstruments);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getInstrumentById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateInstrumentDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateInstrument);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteInstrument);

export default router;
