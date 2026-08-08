import { Router } from "express";
import * as controller from "../controllers/stock.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateStockDto, UpdateStockDto } from "../dtos/physical.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

const router = Router();
const ENTITY_NAME = "STOCK";

router.post("/", validateDto(CreateStockDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createStock);
router.get("/", controller.getAllStock);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getStockById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateStockDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateStock);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteStock);

export default router;
