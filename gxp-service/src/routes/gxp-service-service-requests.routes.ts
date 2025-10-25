import { Router } from "express";
import multer from "multer";
import {
  createServiceRequest,
  getAllSeviceRequests,
  getServiceRequestById
} from "../controllers/gxp-service-service-requests.controller.js";
import API_ROUTES from "../utils/routes.js";

const router = Router();

const upload = multer({ dest: "uploads/" });

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------
router.get(API_ROUTES.SERVICE_REQUESTS.ROOT, getAllSeviceRequests);

router.get(API_ROUTES.SERVICE_REQUESTS.BY_ID, getServiceRequestById);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------
router.post(
  API_ROUTES.SERVICE_REQUESTS.ROOT,
  upload.array("trainingEvidence"),
  createServiceRequest
);

export default router;
