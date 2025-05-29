import { Router } from "express";
import API_ROUTES from "../utils/routes";
import {
  createPermissions,
  deletePermissions,
  getPermissions,
  updatePermissions
} from "../controllers/permission.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import {
  CreatePermissionDto,
  UpdatePermissionDto
} from "../dtos/permission.dto";
import { checkPermissions } from "../middlewares/permission.middleware";

const router: Router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

// Define a GET route for getting roles.
router.get(
  API_ROUTES.PERMISSION,
  checkPermissions(["VIEW:PERMISSION"]),
  getPermissions
);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

// Define a POST route for creating a role.
router.post(
  API_ROUTES.PERMISSION,
  checkPermissions(["CREATE:PERMISSION"]),
  createPermissions
);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

// Define a Patch route for updating a role.
router.patch(
  API_ROUTES.PERMISSION + API_ROUTES.PARAMS,
  checkPermissions(["UPDATE:PERMISSION"]),
  validateDto(IsValidParamsIdDto, "params"),
  validateDto(CreatePermissionDto),
  updatePermissions
);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

// Define a Delete route for updating a role.
router.delete(
  API_ROUTES.PERMISSION + API_ROUTES.PARAMS,
  checkPermissions(["DELETE:PERMISSION"]),
  validateDto(IsValidParamsIdDto, "params"),
  validateDto(UpdatePermissionDto),
  deletePermissions
);

export default router;
