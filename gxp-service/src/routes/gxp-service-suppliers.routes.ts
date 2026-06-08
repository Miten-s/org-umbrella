// src/routes/gxpSupplier.routes.ts
import { Router } from "express";
import {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  disableSupplier,
  enableSupplier,
  deleteSupplier,
  bulkDeleteSuppliers,
  bulkDuplicateSuppliers
} from "../controllers/gxp-service-suppliers.controller";
import API_ROUTES from "../utils/routes";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateSupplierDto, UpdateSupplierDto } from "../dtos/supplier.dto";

const router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get(API_ROUTES.SUPPLIER.ROOT, getSuppliers);

router.get(API_ROUTES.SUPPLIER.BY_ID, getSupplierById);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post(
  API_ROUTES.SUPPLIER.ROOT,
  validateDto(CreateSupplierDto),
  createSupplier
);

router.post(
  API_ROUTES.SUPPLIER.BULK_DELETE,
  bulkDeleteSuppliers
);

router.post(
  API_ROUTES.SUPPLIER.BULK_DUPLICATE,
  bulkDuplicateSuppliers
);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

router.patch(
  API_ROUTES.SUPPLIER.BY_ID,
  validateDto(UpdateSupplierDto),
  updateSupplier
);

router.patch(API_ROUTES.SUPPLIER.DISABLE_BY_ID, disableSupplier);

router.patch(API_ROUTES.SUPPLIER.ENABLE_BY_ID, enableSupplier);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

router.delete(API_ROUTES.SUPPLIER.BY_ID, deleteSupplier);

export default router;
