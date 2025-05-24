import { Router } from "express";
import {
  createDesignation,
  deleteDesignation,
  getAllDesignations,
  getDesignationByName,
  updateDesignation
} from "../controllers/designation.controller";
import API_ROUTES from "../utils/routes";
import { IsValidParamsIdDto } from "../dtos/designation.dto";
import { validateDto } from "../middlewares/validate-dto.middleware";

const router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get(API_ROUTES.DESIGNATION, getAllDesignations);

router.get(
  API_ROUTES.DESIGNATION + API_ROUTES.PARAMS,
  validateDto(IsValidParamsIdDto, "params"),
  getDesignationByName
);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post(API_ROUTES.DESIGNATION, createDesignation);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

router.patch(
  API_ROUTES.DESIGNATION + API_ROUTES.PARAMS,
  validateDto(IsValidParamsIdDto, "params"),
  updateDesignation
);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

router.delete(
  API_ROUTES.DESIGNATION + API_ROUTES.PARAMS,
  validateDto(IsValidParamsIdDto, "params"),
  deleteDesignation
);

export default router;
