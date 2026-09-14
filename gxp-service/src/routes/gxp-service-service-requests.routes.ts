import { Router } from "express";
import {
  createServiceRequest,
  getAllSeviceRequests,
  getServiceRequestById,
  updateServiceRequest,
  deleteServiceRequest,
  getServiceTypes,
  bulkDeleteServiceRequests,
  enableServiceRequest,
  disableServiceRequest,
  bulkCopyServiceRequests,
  bulkUpdateServiceRequests,
  bulkRestoreServiceRequests
} from "../controllers/gxp-service-service-requests.controller.js";
import upload from "../middlewares/multer.middleware.js";
import API_ROUTES from "../utils/routes.js";
import {
  validateDto,
  validateDtoArray
} from "../middlewares/validate-dto.middleware.js";
import {
  CreateServiceRequestDto,
  UpdateServiceRequestDto
} from "../dtos/service-request.dto.js";
import {
  BulkCreateDto,
  BulkUpdateDto,
  BulkOperationDto
} from "../dtos/common.dto.js";
import { authorize } from "../middlewares/authorize.middleware.js";

const router = Router();
const can = (action: "VIEW" | "CREATE" | "UPDATE" | "DELETE") =>
  authorize("SERVICE_REQUEST", action);

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------
router.get(
  API_ROUTES.SERVICE_REQUESTS.GET_SERVICE_TYPES,
  can("VIEW"),
  getServiceTypes
);

router.get(API_ROUTES.SERVICE_REQUESTS.ROOT, can("VIEW"), getAllSeviceRequests);

router.get(
  API_ROUTES.SERVICE_REQUESTS.BY_ID,
  can("VIEW"),
  getServiceRequestById
);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------
router.post(
  API_ROUTES.SERVICE_REQUESTS.ROOT,
  can("CREATE"),
  upload.array("attachments"),
  validateDto(CreateServiceRequestDto),
  createServiceRequest
);

router.post(
  API_ROUTES.SERVICE_REQUESTS.BULK_DELETE,
  can("DELETE"),
  bulkDeleteServiceRequests
);

router.post(
  API_ROUTES.SERVICE_REQUESTS.BULK_COPY,
  can("CREATE"),
  validateDto(BulkCreateDto),
  validateDtoArray(CreateServiceRequestDto, "records"),
  bulkCopyServiceRequests
);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

// bulk-update/bulk-restore MUST register before BY_ID ("/:id") — same one-segment
// path shape, and Express matches whichever is registered first.
router.patch(
  API_ROUTES.SERVICE_REQUESTS.BULK_UPDATE,
  can("UPDATE"),
  validateDto(BulkUpdateDto),
  validateDtoArray(UpdateServiceRequestDto, "updates", "payload"),
  bulkUpdateServiceRequests
);

router.patch(
  API_ROUTES.SERVICE_REQUESTS.BULK_RESTORE,
  can("UPDATE"),
  validateDto(BulkOperationDto),
  bulkRestoreServiceRequests
);

router.patch(
  API_ROUTES.SERVICE_REQUESTS.ENABLE_BY_ID,
  can("UPDATE"),
  enableServiceRequest
);

router.patch(
  API_ROUTES.SERVICE_REQUESTS.DISABLE_BY_ID,
  can("UPDATE"),
  disableServiceRequest
);

router.patch(
  API_ROUTES.SERVICE_REQUESTS.BY_ID,
  can("UPDATE"),
  upload.array("attachments"),
  validateDto(UpdateServiceRequestDto),
  updateServiceRequest
);

router.patch(
  API_ROUTES.SERVICE_REQUESTS.UPDATE_STATUS,
  can("UPDATE"),
  updateServiceRequest
);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

router.delete(
  API_ROUTES.SERVICE_REQUESTS.BY_ID,
  can("DELETE"),
  deleteServiceRequest
);

export default router;
