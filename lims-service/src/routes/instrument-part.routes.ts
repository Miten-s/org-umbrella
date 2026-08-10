import { AppError } from "../middlewares/error.middleware";
import { Router } from "express";
import * as controller from "../controllers/instrument-part.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateInstrumentPartDto, UpdateInstrumentPartDto } from "../dtos/instrument.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

import { BulkOperationDto, RestoreOperationDto } from "../dtos/common.dto";


const router = Router();
const ENTITY_NAME = "INSTRUMENT_PART";

router.post("/", validateDto(CreateInstrumentPartDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createInstrumentPart);
router.get("/", controller.getAllInstrumentParts);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getInstrumentPartById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateInstrumentPartDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateInstrumentPart);
router.patch(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateInstrumentPartDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateInstrumentPart);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteInstrumentPart);

// ─── Bulk / Restore endpoints ────────────────────────────────────────────────
router.post(API_ROUTES.BULK_DELETE, validateDto(BulkOperationDto, "body"), controller.bulkDelete);
router.post(API_ROUTES.BULK_DUPLICATE, validateDto(BulkOperationDto, "body"), controller.bulkDuplicate);
router.patch(API_ROUTES.RESTORE, validateDto(RestoreOperationDto, "body"), controller.restore);
router.get(API_ROUTES.AUDIT_LOGS, controller.getAuditLogs);

export default router;

