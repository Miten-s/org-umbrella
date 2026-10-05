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
  bulkDuplicateSuppliers,
  bulkCopySuppliers,
  bulkUpdateSuppliers,
  bulkRestoreSuppliers
} from "../controllers/gxp-service-suppliers.controller";
import API_ROUTES from "../utils/routes";
import {
  validateDto,
  validateDtoArray
} from "../middlewares/validate-dto.middleware";
import { CreateSupplierDto, UpdateSupplierDto } from "../dtos/supplier.dto";
import {
  BulkCreateDto,
  BulkUpdateDto,
  BulkOperationDto
} from "../dtos/common.dto";
import { authorize } from "../middlewares/authorize.middleware";

const router = Router();
const can = (action: "VIEW" | "CREATE" | "UPDATE" | "DELETE") =>
  authorize("SUPPLIER", action);

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get(API_ROUTES.SUPPLIER.ROOT, can("VIEW"), getSuppliers);

router.get(API_ROUTES.SUPPLIER.BY_ID, can("VIEW"), getSupplierById);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post(
  API_ROUTES.SUPPLIER.ROOT,
  can("CREATE"),
  validateDto(CreateSupplierDto),
  createSupplier
);

router.post(
  API_ROUTES.SUPPLIER.BULK_DELETE,
  can("DELETE"),
  bulkDeleteSuppliers
);

router.post(
  API_ROUTES.SUPPLIER.BULK_DUPLICATE,
  can("CREATE"),
  bulkDuplicateSuppliers
);

router.post(
  API_ROUTES.SUPPLIER.BULK_COPY,
  can("CREATE"),
  validateDto(BulkCreateDto),
  validateDtoArray(CreateSupplierDto, "records"),
  bulkCopySuppliers
);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

// bulk-update/bulk-restore MUST register before BY_ID ("/:id") — same one-segment
// path shape, and Express matches whichever is registered first.
router.patch(
  API_ROUTES.SUPPLIER.BULK_UPDATE,
  can("UPDATE"),
  validateDto(BulkUpdateDto),
  validateDtoArray(UpdateSupplierDto, "updates", "payload"),
  bulkUpdateSuppliers
);

router.patch(
  API_ROUTES.SUPPLIER.BULK_RESTORE,
  can("UPDATE"),
  validateDto(BulkOperationDto),
  bulkRestoreSuppliers
);

router.patch(
  API_ROUTES.SUPPLIER.BY_ID,
  can("UPDATE"),
  validateDto(UpdateSupplierDto),
  updateSupplier
);

router.patch(API_ROUTES.SUPPLIER.DISABLE_BY_ID, can("UPDATE"), disableSupplier);

router.patch(API_ROUTES.SUPPLIER.ENABLE_BY_ID, can("UPDATE"), enableSupplier);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

router.delete(API_ROUTES.SUPPLIER.BY_ID, can("DELETE"), deleteSupplier);

export default router;
