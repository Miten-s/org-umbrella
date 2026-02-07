import { Router } from "express";
import {
  createServiceRequest,
  getAllSeviceRequests,
  getServiceRequestById,
  updateServiceRequest,
  deleteServiceRequest,
  getServiceTypes
} from "../controllers/gxp-service-service-requests.controller.js";
import upload from "../middlewares/multer.middleware.js";
import API_ROUTES from "../utils/routes.js";
import { validateDto } from "../middlewares/validate-dto.middleware.js";
import { CreateServiceRequestDto, UpdateServiceRequestDto } from "../dtos/service-request.dto.js";

const router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------
router.get(API_ROUTES.SERVICE_REQUESTS.GET_SERVICE_TYPES, getServiceTypes);

router.get(API_ROUTES.SERVICE_REQUESTS.ROOT, getAllSeviceRequests);

router.get(API_ROUTES.SERVICE_REQUESTS.BY_ID, getServiceRequestById);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------
router.post(
  API_ROUTES.SERVICE_REQUESTS.ROOT,
  upload.array("attachments"),
  validateDto(CreateServiceRequestDto),
  createServiceRequest
);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

router.patch(
  API_ROUTES.SERVICE_REQUESTS.BY_ID,
  upload.array("attachments"),
  validateDto(UpdateServiceRequestDto),
  updateServiceRequest
);

router.patch(API_ROUTES.SERVICE_REQUESTS.UPDATE_STATUS, updateServiceRequest);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

router.delete(API_ROUTES.SERVICE_REQUESTS.BY_ID, deleteServiceRequest);

export default router;
