import { Router } from "express";
import * as controller from "../controllers/customer.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateCustomerDto, UpdateCustomerDto } from "../dtos/org.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { auditMiddleware } from "../middlewares/audit.middleware";
import API_ROUTES from "../utils/routes";

const router = Router();
const ENTITY_NAME = "CUSTOMER";

router.post("/", validateDto(CreateCustomerDto, "body"), auditMiddleware(ENTITY_NAME, false), controller.createCustomer);
router.get("/", controller.getAllCustomers);
router.get(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), controller.getCustomerById);
router.put(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), validateDto(UpdateCustomerDto, "body"), auditMiddleware(ENTITY_NAME, true), controller.updateCustomer);
router.delete(API_ROUTES.PARAMS, validateDto(IsValidParamsIdDto, "params"), auditMiddleware(ENTITY_NAME, true), controller.deleteCustomer);

export default router;
