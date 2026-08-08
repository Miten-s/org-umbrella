import { Router } from "express";
import * as controller from "../controllers/stock-parameter.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateStockParameterDto, UpdateStockParameterDto } from "../dtos/physical.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

const router = Router();
const ENTITY_NAME = "STOCK_PARAMETER";

router.post("/", validateDto(CreateStockParameterDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createStockParameter);
router.get("/", controller.getAllStockParameters);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getStockParameterById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateStockParameterDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateStockParameter);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteStockParameter);

export default router;
