import { Router } from "express";
import * as controller from "../controllers/supplier.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateSupplierDto, UpdateSupplierDto } from "../dtos/org.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

const router = Router();
const ENTITY_NAME = "SUPPLIER";

router.post("/", validateDto(CreateSupplierDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createSupplier);
router.get("/", controller.getAllSuppliers);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getSupplierById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateSupplierDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateSupplier);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteSupplier);

export default router;
