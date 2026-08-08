import { Router } from "express";
import * as controller from "../controllers/stock-batch.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateStockBatchDto, UpdateStockBatchDto } from "../dtos/physical.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

const router = Router();
const ENTITY_NAME = "STOCK_BATCH";

router.post("/", validateDto(CreateStockBatchDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createStockBatch);
router.get("/", controller.getAllStockBatches);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getStockBatchById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateStockBatchDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateStockBatch);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteStockBatch);

export default router;
