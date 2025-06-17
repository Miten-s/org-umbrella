import { Router } from "express";
import {
  createDesignation,
  deleteDesignation,
  getAllDesignations,
  getDesignationByName,
  updateDesignation
} from "../controllers/designation.controller";
import API_ROUTES from "../utils/routes";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { checkPermissions } from "../middlewares/permission.middleware";

const router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get(
  API_ROUTES.DESIGNATION,
  checkPermissions(["VIEW:DESIGNATION"]),
  getAllDesignations
);

router.get(
  API_ROUTES.DESIGNATION + API_ROUTES.PARAMS,
  checkPermissions(["VIEW:DESIGNATION"]),
  validateDto(IsValidParamsIdDto, "params"),
  getDesignationByName
);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post(
  API_ROUTES.DESIGNATION,
  checkPermissions(["CREATE:DESIGNATION"]),
  createDesignation
);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

router.patch(
  API_ROUTES.DESIGNATION + API_ROUTES.PARAMS,
  checkPermissions(["UPDATE:DESIGNATION"]),
  validateDto(IsValidParamsIdDto, "params"),
  updateDesignation
);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

router.delete(
  API_ROUTES.DESIGNATION + API_ROUTES.PARAMS,
  checkPermissions(["DELETE:DESIGNATION"]),
  validateDto(IsValidParamsIdDto, "params"),
  deleteDesignation
);

export default router;
