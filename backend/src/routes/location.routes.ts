import { Router } from "express";
import {
  createLocation,
  getAllLocations,
  getLocationById,
  updateLocation,
  deleteLocation
} from "../controllers/location.controller";
import API_ROUTES from "../utils/routes";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { UpdateLocationDto } from "../dtos/location.dto";
import { CreateDesignationDto } from "../dtos/designation.dto";
import { checkPermissions } from "../middlewares/permission.middleware";

const router = Router();
// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get(
  API_ROUTES.LOCATIONS,
  checkPermissions(["VIEW:LOCATION"]),
  getAllLocations
);

router.get(
  API_ROUTES.LOCATIONS + API_ROUTES.PARAMS,
  checkPermissions(["VIEW:LOCATION"]),
  validateDto(IsValidParamsIdDto, "params"),
  validateDto(CreateDesignationDto),
  getLocationById
);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post(
  API_ROUTES.LOCATIONS,
  checkPermissions(["CREATE:LOCATION"]),
  createLocation
);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

router.patch(
  API_ROUTES.LOCATIONS + API_ROUTES.PARAMS,
  checkPermissions(["UPDATE:LOCATION"]),
  validateDto(IsValidParamsIdDto, "params"),
  validateDto(UpdateLocationDto),
  updateLocation
);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

router.delete(
  API_ROUTES.LOCATIONS + API_ROUTES.PARAMS,
  checkPermissions(["DELETE:LOCATION"]),
  validateDto(IsValidParamsIdDto, "params"),
  deleteLocation
);
export default router;
