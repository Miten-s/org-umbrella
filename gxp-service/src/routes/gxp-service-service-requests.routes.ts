import { Router } from "express";
import {
  createServiceRequest,
  getAllSeviceRequests,
  getServiceRequestById,
  updateServiceRequest,
  deleteServiceRequest,
  getServiceTypes
} from "../controllers/gxp-service-service-requests.controller.js";
import API_ROUTES from "../utils/routes.js";

const router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------
router.get(API_ROUTES.SERVICE_REQUESTS.GET_SERVICE_TYPES, getServiceTypes);

router.get(API_ROUTES.SERVICE_REQUESTS.ROOT, getAllSeviceRequests);

router.get(API_ROUTES.SERVICE_REQUESTS.BY_ID, getServiceRequestById);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------
router.post(API_ROUTES.SERVICE_REQUESTS.ROOT, createServiceRequest);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

// Sanitization is Left for the payload

router.patch(API_ROUTES.SERVICE_REQUESTS.BY_ID, updateServiceRequest);

router.patch(API_ROUTES.SERVICE_REQUESTS.UPDATE_STATUS, updateServiceRequest);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

router.delete(API_ROUTES.SERVICE_REQUESTS.BY_ID, deleteServiceRequest);

export default router;
