import { Router } from "express";
import * as controller from "../controllers/instrument-part.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateInstrumentPartDto, UpdateInstrumentPartDto } from "../dtos/instrument.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

const router = Router();
const ENTITY_NAME = "INSTRUMENT_PART";

router.post("/", validateDto(CreateInstrumentPartDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createInstrumentPart);
router.get("/", controller.getAllInstrumentParts);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getInstrumentPartById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateInstrumentPartDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateInstrumentPart);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteInstrumentPart);

export default router;
