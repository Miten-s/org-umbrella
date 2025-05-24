import { Router } from "express";
import API_ROUTES from "../utils/routes";
import {
  createPermissions,
  deletePermissions,
  getPermissions,
  updatePermissions
} from "../controllers/permission.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { IsValidParamsIdDto } from "../dtos/designation.dto";

const router: Router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

// Define a GET route for getting roles.
router.get(API_ROUTES.PERMISSION, getPermissions);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

// Define a POST route for creating a role.
router.post(API_ROUTES.PERMISSION, createPermissions);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

// Define a Patch route for updating a role.
router.patch(
  API_ROUTES.PERMISSION + API_ROUTES.PARAMS,
  validateDto(IsValidParamsIdDto, "params"),
  updatePermissions
);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

// Define a Delete route for updating a role.
router.delete(
  API_ROUTES.PERMISSION + API_ROUTES.PARAMS,
  validateDto(IsValidParamsIdDto, "params"),
  deletePermissions
);

export default router;
