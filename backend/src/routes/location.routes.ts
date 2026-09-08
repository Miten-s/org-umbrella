import { Router } from "express";
import {
  createLocation,
  getAllLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
  bulkDeleteLocations,
  bulkDuplicateLocations,
  bulkCopyLocations,
  bulkUpdateLocations
} from "../controllers/location.controller";
import API_ROUTES from "../utils/routes";
import {
  validateDto,
  validateDtoArray
} from "../middlewares/validate-dto.middleware";
import {
  BulkCreateDto,
  BulkUpdateDto,
  IsValidParamsIdDto
} from "../dtos/common.dto";
import { CreateLocationDto, UpdateLocationDto } from "../dtos/location.dto";
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
  getLocationById
);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post(
  API_ROUTES.LOCATIONS,
  checkPermissions(["CREATE:LOCATION"]),
  createLocation
);

router.post(
  API_ROUTES.LOCATIONS + API_ROUTES.BULK_DELETE,
  checkPermissions(["DELETE:LOCATION"]),
  bulkDeleteLocations
);

router.post(
  API_ROUTES.LOCATIONS + API_ROUTES.BULK_DUPLICATE,
  checkPermissions(["CREATE:LOCATION"]),
  bulkDuplicateLocations
);

router.post(
  API_ROUTES.LOCATIONS + API_ROUTES.BULK_COPY,
  checkPermissions(["CREATE:LOCATION"]),
  validateDto(BulkCreateDto),
  validateDtoArray(CreateLocationDto, "records"),
  bulkCopyLocations
);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

// Registered BEFORE the single-record PARAMS patch below: both are one-segment PATCH
// routes ("/bulk-update" vs "/:id"), so PARAMS going first would match "/bulk-update" as id="bulk-update".
router.patch(
  API_ROUTES.LOCATIONS + API_ROUTES.BULK_UPDATE,
  checkPermissions(["UPDATE:LOCATION"]),
  validateDto(BulkUpdateDto),
  validateDtoArray(UpdateLocationDto, "updates", "payload"),
  bulkUpdateLocations
);

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
