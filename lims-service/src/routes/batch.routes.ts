import { Router } from "express";
import * as controller from "../controllers/batch.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateBatchDto, UpdateBatchDto } from "../dtos/execution.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

const router = Router();
const ENTITY_NAME = "BATCH";

router.post("/", validateDto(CreateBatchDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createBatch);
router.get("/", controller.getAllBatches);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getBatchById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateBatchDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateBatch);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteBatch);

export default router;
